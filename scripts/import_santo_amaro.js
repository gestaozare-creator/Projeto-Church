const fs = require('fs');
const xlsx = require('xlsx');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

function excelDateToJSDate(serial) {
  if (!serial) return null;
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

async function run() {
  const { data: churches } = await supabase.from('churches').select('*');
  const santoAmaro = churches.find(c => c.name.toLowerCase().includes('santo amaro'));
  
  if (!santoAmaro) {
    console.error('Church Santo Amaro not found!');
    return;
  }
  
  console.log(`Found Santo Amaro with ID: ${santoAmaro.id}`);
  
  // First, delete existing members for Santo Amaro to avoid duplication if we re-run
  console.log('Deleting existing members for Santo Amaro to avoid duplicates...');
  await supabase.from('members').delete().eq('church_id', santoAmaro.id);
  console.log('Existing members deleted.');

  const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Lista de Membros Santo Amaro.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: null });
  
  let toInsert = [];
  
  for (const row of data) {
    const nome = row['Nome completo'];
    if (!nome) continue;
    
    // Attempt to extract values securely based on column name
    const birthDateSerial = row['Data nascimento'];
    const integrationDateSerial = row['Data Batismo/ordenação'];
    
    let birthDate = '1900-01-01';
    let integrationDate = new Date().toISOString().split('T')[0];
    
    if (birthDateSerial) {
      if (!isNaN(Number(birthDateSerial))) {
        birthDate = excelDateToJSDate(Number(birthDateSerial));
      } else {
        // Fallback for string dates (dd/mm/yyyy)
        let parts = String(birthDateSerial).split('/');
        if (parts.length === 3) {
          if (parseInt(parts[1]) > 12) {
             let temp = parts[0]; parts[0] = parts[1]; parts[1] = temp;
          }
          let year = parts[2].length === 2 ? (parseInt(parts[2]) > 30 ? '19'+parts[2] : '20'+parts[2]) : parts[2];
          birthDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    if (integrationDateSerial) {
      if (!isNaN(Number(integrationDateSerial))) {
        integrationDate = excelDateToJSDate(Number(integrationDateSerial));
      } else {
        let parts = String(integrationDateSerial).split('/');
        if (parts.length === 3) {
          if (parseInt(parts[1]) > 12) {
             let temp = parts[0]; parts[0] = parts[1]; parts[1] = temp;
          }
          let year = parts[2].length === 2 ? (parseInt(parts[2]) > 30 ? '19'+parts[2] : '20'+parts[2]) : parts[2];
          integrationDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    // Default status handling
    let rawStatus = String(row['Status Membro'] || 'Ativo').toLowerCase();
    let status = 'ativo';
    if (rawStatus.includes('inativo')) status = 'inativo';
    else if (rawStatus.includes('disciplina')) status = 'inativo';

    const member = {
      id: crypto.randomUUID(),
      church_id: santoAmaro.id,
      name: nome.trim(),
      email: row['E-mail'] ? String(row['E-mail']).trim() : '',
      phone: row['Telefone Celular'] ? String(row['Telefone Celular']).replace(/\\D/g, '') : '',
      address: row['Endereço Completo (Ex: Rua, n°, Cidade,Bairro)'] ? String(row['Endereço Completo (Ex: Rua, n°, Cidade,Bairro)']).trim() : '',
      status: status,
      ministry: row['Ministério'] ? String(row['Ministério']).trim() : 'Geral',
      function: 'Membro',
      birth_date: birthDate,
      integration_date: integrationDate,
      marital_status: row['Estado Civil'] ? String(row['Estado Civil']).trim() : ''
    };
    
    toInsert.push(member);
  }
  
  console.log(`Inserting ${toInsert.length} members...`);
  
  // Insert in batches of 50
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase.from('members').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    }
  }
  
  console.log('Import finished! Successfully imported members.');
}

run();
