const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});
if(!supabaseKey){
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('members').select('ministry').in('function', ['Visitante (Kids)', 'Visitante', 'Ainda não definida']);
  if(data) {
     const sources = new Set(data.map(d => d.ministry).filter(s => s && s.trim().length > 0 && s !== 'Outro'));
     console.log('Distinct sources:', Array.from(sources));
  }
}
run();
