const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});
const supabase = createClient(supabaseUrl, supabaseKey);

const dayMap = {
  'domingo': 0,
  'segunda': 1,
  'terça': 2,
  'quarta': 3,
  'quinta': 4,
  'sexta': 5,
  'sabado': 6,
  'sábado': 6
};

async function run() {
  const { data: churches } = await supabase.from('churches').select('id, name');
  const sitio = churches.find(c => c.name.toLowerCase().includes('sitio cercado') || c.name.toLowerCase().includes('sítio cercado'));

  const { data: txs } = await supabase.from('transactions').select('*').eq('church_id', sitio.id);

  let updated = 0;
  for (const t of txs) {
    let targetDay = -1;
    const desc = t.description.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
    for (const [key, val] of Object.entries(dayMap)) {
      if (desc.includes(key)) {
        targetDay = val;
        break;
      }
    }

    let newDate = t.date;
    if (targetDay !== -1) {
      let d = new Date(t.date + 'T12:00:00Z');
      while (d.getUTCDay() !== targetDay) {
        d.setUTCDate(d.getUTCDate() - 1);
      }
      newDate = d.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('transactions').update({
      date: newDate,
      payment_method: null
    }).eq('id', t.id);

    if (error) console.error(error);
    else updated++;
  }

  console.log(`Updated ${updated} transactions.`);
}
run();
