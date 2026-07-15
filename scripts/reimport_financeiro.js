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
  if (!serial || isNaN(serial)) return null;
  const excelEpoch = new Date(1899, 11, 30);
  const parsedDate = new Date(excelEpoch.getTime() + serial * 86400000);
  return parsedDate.toISOString().split('T')[0];
}

async function run() {
  const { data: churches } = await supabase.from('churches').select('id, name');
  const sitio = churches.find(c => c.name.toLowerCase().includes('sitio cercado') || c.name.toLowerCase().includes('sítio cercado'));
  if (!sitio) {
    console.error('Church "Sitio Cercado" not found.');
    return;
  }
  console.log(`Found Sitio Cercado with ID: ${sitio.id}`);

  // Delete all existing transactions for Sitio Cercado to avoid duplicates
  console.log('Deleting existing transactions for Sitio Cercado...');
  const { error: delError } = await supabase.from('transactions').delete().eq('church_id', sitio.id);
  if (delError) {
    console.error('Failed to delete existing transactions:', delError);
    return;
  }

  const wb = xlsx.readFile('E:\\Desktop\\IPCN\\Dados financeiro Igreja Sitio Cercado.xlsx');
  const sheetName = wb.SheetNames[0];
  // We use header: 1 to get a 2D array, which is safer for this side table logic
  const rawData = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  
  // Headers are in row 0
  const headers = rawData[0];
  const idMovIdx = headers.indexOf('IdMovimentacao');
  const tipoIdx = headers.indexOf('Tipo');
  // First 'Caracteristica de entrada' is index 3 (the FK ID)
  const caracIdIdx = 3; 
  const catIdx = headers.indexOf('Categoria');
  const valorIdx = headers.indexOf('Valor');
  const formaPgtoIdx = headers.indexOf('FormaPagamento');
  const vencIdx = headers.indexOf('Vencimento');
  const pagoIdx = headers.indexOf('Pago?');
  const dataPgtoIdx = headers.indexOf('DataPagamento');
  
  // Side table mapping:
  const mapDict = {};
  for (let i = 1; i < rawData.length; i++) {
    const r = rawData[i];
    const sideId = r[12]; // Idcaracteristicadeentrada
    const sideVal = r[13]; // Caracteristica de entrada_1
    if (sideId && sideVal) {
      mapDict[String(sideId).trim()] = String(sideVal).trim();
    }
  }
  
  console.log('Lookup dictionary parsed:', mapDict);

  const toInsert = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row[idMovIdx]) continue; // skip empty rows

    let type = 'receita';
    const tipoRaw = String(row[tipoIdx] || '').toLowerCase();
    if (tipoRaw.includes('pagamento') || tipoRaw.includes('despesa')) {
      type = 'despesa';
    }

    const amount = Number(row[valorIdx]) || 0;
    const paymentDate = excelDateToJSDate(row[dataPgtoIdx]);
    const dueDate = excelDateToJSDate(row[vencIdx]);
    const isPaid = String(row[pagoIdx] || '').toLowerCase();
    const status = (isPaid.includes('recebido') || isPaid.includes('pago') || isPaid.includes('sim')) ? 'confirmado' : 'pendente';
    
    const finalDate = paymentDate || dueDate || new Date().toISOString().split('T')[0];

    let paymentMethod = String(row[formaPgtoIdx] || '').trim();
    if (paymentMethod === 'À vista') paymentMethod = 'Dinheiro';

    // LOOKUP THE ID IN THE DICTIONARY!
    const fkId = String(row[caracIdIdx] || '').trim();
    let desc = mapDict[fkId] || fkId;
    if (!desc) desc = 'Outros';

    toInsert.push({
      id: crypto.randomUUID(),
      church_id: sitio.id,
      type: type,
      amount: amount,
      date: finalDate,
      category: String(row[catIdx] || 'Outros'),
      description: desc,
      status: status,
      payment_method: paymentMethod,
      due_date: dueDate,
      paid_date: paymentDate
    });
  }

  console.log(`Inserting ${toInsert.length} transactions...`);

  // Insert in batches of 100
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await supabase.from('transactions').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    }
  }

  console.log('Import finished! Correctly mapped side-table features.');
}

run();
