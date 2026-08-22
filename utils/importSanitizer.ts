/**
 * Funções de higienização e inteligência de dados para importação de planilhas.
 */

// Remove letras e formata para o padrão brasileiro de celular ou fixo (somente números para o Supabase)
export function sanitizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  
  // Se veio com DDI +55 e for celular (ex: 5527999999999)
  if (digits.length === 13 && digits.startsWith('55')) {
    return digits.substring(2);
  }
  
  // Se for celular normal com DDD
  if (digits.length === 11) {
    return digits;
  }
  
  // Se for fixo com DDD
  if (digits.length === 10) {
    return digits;
  }
  
  // Retorna como está se não bateu, o Supabase guardará limpo
  return digits;
}

// Formatação visual caso precise (embora o Supabase geralmente guarde os dígitos)
export function formatPhoneVisually(phoneStr: string): string {
  const p = sanitizePhone(phoneStr);
  if (p.length === 11) return `(${p.substring(0, 2)}) ${p.substring(2, 7)}-${p.substring(7)}`;
  if (p.length === 10) return `(${p.substring(0, 2)}) ${p.substring(2, 6)}-${p.substring(6)}`;
  return p;
}

// Capitaliza Nomes ("joão da silva" -> "João da Silva")
export function capitalizeName(rawName: string): string {
  if (!rawName) return '';
  const lowerWords = ['da', 'de', 'do', 'das', 'dos', 'e'];
  return String(rawName)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index !== 0 && lowerWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Tenta converter datas de Excel (número de dias) ou strings erradas para YYYY-MM-DD
export function parseDate(rawDate: any): string {
  if (!rawDate) return '';
  
  // Excel Serial Date (ex: 44000)
  if (typeof rawDate === 'number' || (!isNaN(Number(rawDate)) && Number(rawDate) > 10000)) {
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 86400000;
    const dateObj = new Date(excelEpoch.getTime() + Number(rawDate) * msPerDay);
    return dateObj.toISOString().split('T')[0];
  }
  
  const str = String(rawDate).trim();
  
  // Já está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Formato DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Formato MM/DD/YYYY (Americano)
  const usMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  // Cuidado: ambiguidade entre DD/MM e MM/DD. Vamos assumir DD/MM para Brasil como default
  // O brMatch já pegou.
  
  return '';
}

// Aproxima o estado civil do formato aceito
export function matchMaritalStatus(raw: string): string {
  const s = String(raw).trim().toLowerCase();
  if (s.includes('casad')) return 'Casado(a)';
  if (s.includes('solteir')) return 'Solteiro(a)';
  if (s.includes('viúv') || s.includes('viuv')) return 'Viúvo(a)';
  if (s.includes('divorciad')) return 'Divorciado(a)';
  if (s.includes('separad')) return 'Divorciado(a)';
  return 'Outro';
}

// Verifica e limpa campo Sim/Não
export function matchBoolean(raw: string): string {
  const s = String(raw).trim().toLowerCase();
  if (s === 'sim' || s === 's' || s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Sim';
  if (s === 'não' || s === 'nao' || s === 'n' || s === 'no' || s === 'false' || s === '0') return 'Não';
  return '';
}

// Interface da linha processada
export interface ProcessedRow {
  originalIndex: number;
  data: Record<string, any>; // Campos limpos
  status: 'ok' | 'warning' | 'error';
  messages: string[]; // Avisos ou erros detalhados
}

export function processImportRow(row: any, index: number, churchId: string, existingPhonesMap: Map<string, string>): ProcessedRow {
  const processed: Record<string, any> = {
    church_id: churchId,
    status: 'ativo' // Padrão
  };
  
  const messages: string[] = [];
  let rowStatus: 'ok' | 'warning' | 'error' = 'ok';

  // 1. Nome (Obrigatório)
  const rawName = row['Nome'] || row['NOME'] || row['nome'] || '';
  if (!rawName) {
    rowStatus = 'error';
    messages.push('Falta Nome do membro.');
  } else {
    processed.name = capitalizeName(rawName);
    if (processed.name !== rawName) {
      if(rowStatus === 'ok') rowStatus = 'warning';
      messages.push(`Nome capitalizado.`);
    }
  }

  // 2. Telefone (Importante para o Upsert)
  const rawPhone = row['Telefone'] || row['Celular'] || row['WhatsApp'] || row['telefone'] || '';
  const cleanPhone = sanitizePhone(rawPhone);
  
  if (cleanPhone) {
    processed.phone = cleanPhone;
    if (existingPhonesMap.has(cleanPhone)) {
      rowStatus = 'warning';
      processed.id = existingPhonesMap.get(cleanPhone); // Atribui o ID para o Upsert
      messages.push(`Telefone ${cleanPhone} já existe. Dados serão mesclados (Atualização).`);
    } else if (cleanPhone !== String(rawPhone).trim()) {
      if(rowStatus === 'ok') rowStatus = 'warning';
      messages.push(`Telefone formatado.`);
    }
  } else {
    if (rawPhone) {
      messages.push(`Telefone "${rawPhone}" inválido. Será deixado em branco.`);
      if(rowStatus === 'ok') rowStatus = 'warning';
    }
    processed.phone = '';
  }

  // Se não foi um Upsert e precisa de um ID novo
  if (!processed.id) {
    processed.id = 'm_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // 3. E-mail
  processed.email = row['Email'] || row['E-mail'] || row['email'] || '';

  // 4. Função
  const func = row['Função'] || row['Funcao'] || row['Cargo'] || '';
  processed.function = func ? capitalizeName(func) : 'Membro';

  // 5. Ministério
  const min = row['Ministério'] || row['Ministerio'] || row['Departamento'] || '';
  processed.ministry = min ? capitalizeName(min) : '';

  // 6. Endereço
  processed.address = row['Endereço'] || row['Endereco'] || '';

  // 7. Nascimento
  const rawBirth = row['Data de Nascimento'] || row['Nascimento'] || row['Data Nasc'] || '';
  processed.birth_date = parseDate(rawBirth);
  if (rawBirth && !processed.birth_date) {
    if(rowStatus === 'ok') rowStatus = 'warning';
    messages.push(`Formato de Nascimento não reconhecido. Deixado em branco.`);
  }

  // 8. Estado Civil
  const rawMarital = row['Estado Civil'] || row['Civil'] || '';
  processed.marital_status = rawMarital ? matchMaritalStatus(rawMarital) : '';

  // 9. Batismo
  const rawBap = row['Batizado'] || row['Batizado?'] || row['Batismo'] || '';
  processed.is_baptized = matchBoolean(rawBap);

  // 10. Data Batismo
  const rawBapDate = row['Data Batismo'] || row['Data de Batismo'] || '';
  processed.baptism_date = parseDate(rawBapDate);

  // 11. Integração
  const rawInt = row['Data Integração'] || row['Integração'] || '';
  processed.integration_date = parseDate(rawInt);

  // 12. Profissão
  processed.profession = row['Profissão'] || row['Profissao'] || '';

  return {
    originalIndex: index,
    data: processed,
    status: rowStatus,
    messages
  };
}
