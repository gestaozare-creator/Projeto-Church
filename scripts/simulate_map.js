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
  const { data: dbChurches } = await supabase.from('churches').select('*');
  const activeChurch = dbChurches.find(c => c.is_headquarters) || dbChurches[0];
  
  let geocache = {};
  try {
      const config = typeof activeChurch.config === 'string' ? JSON.parse(activeChurch.config) : (activeChurch.config || {});
      geocache = config.geocache || {};
  } catch(e) {}
  
  let allMembers = [];
  let page = 0;
  while(true){
    let { data } = await supabase.from('members').select('*').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    allMembers = [...allMembers, ...data];
    if (data.length < 1000) break;
    page++;
  }
  
  const filteredPeople = allMembers
      .filter(m => m.church_id === activeChurch.id)
      .map(m => ({
        id: m.id, name: m.name, phone: m.phone, address: m.address,
        type: (m.function === 'Visitante' || m.function === 'Visitante (Kids)' || m.function === 'Ainda não definida' ? 'visitante' : 'membro')
      }));

  let validMarkers = 0;
  let missing = [];
  filteredPeople.forEach(p => {
      const addr = p.address ? p.address.trim() : '';
      const geo = geocache[addr];
      if (geo) {
          validMarkers++;
      } else {
          missing.push(addr);
      }
  });
  
  console.log(`Total filteredPeople: ${filteredPeople.length}`);
  console.log(`Valid markers that would render: ${validMarkers}`);
  console.log(`Missing from cache (first 10):`, [...new Set(missing)].slice(0, 10));
}
run();
