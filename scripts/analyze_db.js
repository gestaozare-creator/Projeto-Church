const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: members } = await supabase.from('members').select('*');
  
  const guadalupe = members.filter(m => m.church_id === '1782771173659');
  const sitio = members.filter(m => m.church_id === '1783651900734');
  const santo = members.filter(m => m.church_id === '1784073311817');

  console.log(`Guadalupe members in DB: ${guadalupe.length}`);
  console.log(`Sítio Cercado members in DB: ${sitio.length}`);
  console.log(`Santo Amaro members in DB: ${santo.length}`);

  const sitioV = sitio.filter(m => m.function && m.function.toLowerCase().includes('visitante'));
  console.log(`Sítio Cercado potential visitors (by function): ${sitioV.length}`);
  
  const santoV = santo.filter(m => (m.function && m.function.toLowerCase().includes('visitante')) || (m.status && m.status.toLowerCase().includes('visitante')));
  console.log(`Santo Amaro potential visitors: ${santoV.length}`);
  
  // Show functions used in Santo Amaro to understand why it might have 3 visitors
  const santoFunctions = [...new Set(santo.map(m => m.function))];
  const santoStatuses = [...new Set(santo.map(m => m.status))];
  console.log(`Santo Amaro functions:`, santoFunctions);
  console.log(`Santo Amaro statuses:`, santoStatuses);
  
}
run().catch(console.error);
