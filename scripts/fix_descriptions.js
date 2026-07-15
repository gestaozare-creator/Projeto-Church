const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: churches } = await supabase.from('churches').select('id, name');
  const sitio = churches.find(c => c.name.toLowerCase().includes('sitio cercado') || c.name.toLowerCase().includes('sítio cercado'));

  const { data: txs } = await supabase.from('transactions').select('*').eq('church_id', sitio.id);

  let updated = 0;
  for (const t of txs) {
    let newDesc = t.description;

    const descLower = t.description.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
    
    if (descLower.includes('segunda')) newDesc = ' - Culto de Segunda-feira';
    else if (descLower.includes('terca')) newDesc = ' - Culto de Terça-feira';
    else if (descLower.includes('quarta')) newDesc = ' - Culto de Quarta-feira';
    else if (descLower.includes('quinta')) newDesc = ' - Culto de Quinta-feira';
    else if (descLower.includes('sexta')) newDesc = ' - Culto de Sexta-feira';
    else if (descLower.includes('sabado')) newDesc = ' - Culto de Sábado';
    else if (descLower.includes('domingo')) newDesc = ' - Culto de Domingo';
    else if (descLower.includes('fora de culto')) newDesc = '';

    if (newDesc !== t.description) {
      const { error } = await supabase.from('transactions').update({
        description: newDesc
      }).eq('id', t.id);

      if (error) console.error(error);
      else updated++;
    }
  }

  console.log(`Updated ${updated} descriptions.`);
}
run();
