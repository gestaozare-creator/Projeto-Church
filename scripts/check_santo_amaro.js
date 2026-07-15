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
  let allMembers = [];
  let page = 0;
  while(true) {
    const { data } = await supabase.from('members').select('*').eq('church_id', '1784073311817').range(page*1000, (page+1)*1000 - 1);
    if(data && data.length > 0) {
       allMembers = allMembers.concat(data);
       if(data.length < 1000) break;
       page++;
    } else break;
  }
  
  console.log(`Santo Amaro total members: ${allMembers.length}`);
  const santoFunctions = [...new Set(allMembers.map(m => m.function))];
  const santoStatuses = [...new Set(allMembers.map(m => m.status))];
  console.log(`Santo Amaro functions:`, santoFunctions);
  console.log(`Santo Amaro statuses:`, santoStatuses);
  
  const visitors = allMembers.filter(m => 
    (m.function && m.function.toLowerCase().includes('visitante')) || 
    (m.status && m.status.toLowerCase().includes('visitante')) ||
    (m.status === 'em_conversao')
  );
  console.log(`Found potential visitors in Santo Amaro: ${visitors.length}`);
  console.log(visitors.map(v => ({name: v.name, function: v.function, status: v.status})));
}

run().catch(console.error);
