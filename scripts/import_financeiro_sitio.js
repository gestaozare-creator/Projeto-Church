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

  const wb = xlsx.readFile('E:\\Desktop\\IPCN\\Dados financeiro Igreja Sitio Cercado.xlsx');
  const sheetName = wb.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

  const toInsert = [];

  for (const row of data) {
    let type = 'receita';
    const tipoRaw = String(row['Tipo'] || '').toLowerCase();
    if (tipoRaw.includes('pagamento') || tipoRaw.includes('despesa')) {
      type = 'despesa';
    }

    const amount = Number(row['Valor']) || 0;
    const paymentDate = excelDateToJSDate(row['DataPagamento']);
    const dueDate = excelDateToJSDate(row['Vencimento']);
    const isPaid = String(row['Pago?'] || '').toLowerCase();
    const status = (isPaid.includes('recebido') || isPaid.includes('pago') || isPaid.includes('sim')) ? 'pago' : 'pendente';
    
    // Some lines might not have DataPagamento if they are not paid
    const finalDate = paymentDate || dueDate || new Date().toISOString().split('T')[0];

    let paymentMethod = String(row['FormaPagamento'] || '').trim();
    if (paymentMethod === 'À vista') paymentMethod = 'Dinheiro';

    let desc = String(row['Caracteristica de entrada_1'] || '').trim();
    
    toInsert.push({
      id: crypto.randomUUID(),
      church_id: sitio.id,
      type: type,
      amount: amount,
      date: finalDate,
      category: row['Categoria'] || 'Outros',
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

  console.log('Import finished! Successfully imported financial records.');
}

run();
