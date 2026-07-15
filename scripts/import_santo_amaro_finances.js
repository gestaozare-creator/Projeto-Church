const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

// Initialize Supabase
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Get Santo Amaro Church
  const { data: churches } = await supabase.from('churches').select('*');
  const santoAmaro = churches.find(c => c.name.toLowerCase().includes('santo amaro'));
  if (!santoAmaro) throw new Error("Church Santo Amaro not found");
  
  console.log("Found Santo Amaro Church:", santoAmaro.name, santoAmaro.id);

  // Read Excel
  const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Dados Financeiro Igreja Santo amaro.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  
  const sideTable = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[12] && row[13]) {
       sideTable[row[12]] = row[13];
    }
  }

  const receitasToAdd = new Set();
  const despesasToAdd = new Set();
  const transactions = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue;
    
    const rawType = String(row[1]).trim().toUpperCase(); // DESPESA or RECEBIMENTO
    const type = rawType === 'RECEBIMENTO' ? 'receita' : 'despesa';
    
    let rawDate = row[7]; // Vencimento
    let status = String(row[8]).toLowerCase() === 'pago' ? 'confirmado' : 'pendente';
    let paymentMethod = row[6] || ''; // FormaPagamento
    
    // Parse Excel date
    let dateObj = new Date();
    if (typeof rawDate === 'number') {
      dateObj = new Date((rawDate - (25569)) * 86400 * 1000);
    }
    
    const categoryId = row[3]; // kj84fgu95g1
    let dayOfWeekName = sideTable[categoryId] || categoryId;
    
    let desc = '';
    if (dayOfWeekName && dayOfWeekName !== 'Entradas Fora de cultos') {
      desc = dayOfWeekName.replace(' - Feira', '-feira');
      if (!desc.startsWith(' - Culto de')) {
        desc = ` - Culto de ${desc}`;
      }
    }
    
    // Adjust Date to match day of week (similar to previous fix)
    const mapDay = {
      'Domingo': 0, 'Segunda - Feira': 1, 'Terça - Feira': 2,
      'Quarta - Feira': 3, 'Quinta - Feira': 4, 'Sexta - Feira': 5, 'Sabado': 6
    };
    if (mapDay[dayOfWeekName] !== undefined) {
      const targetDay = mapDay[dayOfWeekName];
      let currentDay = dateObj.getDay();
      if (currentDay !== targetDay) {
        let diff = currentDay - targetDay;
        if (diff < 0) diff += 7; // Go backwards to the most recent targetDay
        dateObj.setDate(dateObj.getDate() - diff);
      }
    }
    
    const isoDate = dateObj.toISOString().split('T')[0];
    const amount = Number(row[5]) || 0;
    const cat = String(row[4] || '').trim();
    
    if (type === 'receita') {
      if (cat) receitasToAdd.add(cat);
    } else {
      if (cat) despesasToAdd.add(cat);
    }

    transactions.push({
      church_id: santoAmaro.id,
      type: type,
      category: cat,
      amount: amount,
      description: desc,
      date: isoDate,
      paid_date: status === 'confirmado' ? isoDate : null,
      due_date: status === 'pendente' ? isoDate : null,
      status: status,
      payment_method: paymentMethod,
    });
  }

  // Update Config
  let currentConfig = santoAmaro.config || {};
  let currentReceitas = currentConfig.receitas || ['Dízimo', 'Oferta', 'Oferta Oficial', 'Campanha', 'Doação', 'Aluguel de Espaço'];
  let currentDespesas = currentConfig.despesas || ['Água', 'Luz', 'Aluguel', 'Salário', 'Manutenção', 'Marketing', 'Eventos'];
  
  let newReceitas = Array.from(new Set([...currentReceitas, ...Array.from(receitasToAdd)]));
  let newDespesas = Array.from(new Set([...currentDespesas, ...Array.from(despesasToAdd)]));
  
  currentConfig.receitas = newReceitas;
  currentConfig.despesas = newDespesas;
  
  await supabase.from('churches').update({ config: currentConfig }).eq('id', santoAmaro.id);
  console.log(`Updated Config: added ${receitasToAdd.size} receitas and ${despesasToAdd.size} despesas categories.`);

  // Insert Transactions
  if (transactions.length > 0) {
    const { error: tErr } = await supabase.from('transactions').insert(transactions);
    if (tErr) console.error("Error inserting transactions:", tErr);
    else console.log(`Inserted ${transactions.length} transactions.`);
  }
}

run().catch(console.error);
