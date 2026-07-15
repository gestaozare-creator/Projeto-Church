const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});
if (!supabaseKey) {
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const GUADALUPE = '1782771173659';
  const SITIO = '1783651900734';
  const SANTO = '1784073311817';

  // 1. GUADALUPE: Delete all from members
  console.log("Deleting all Guadalupe members (they are actually visitors)...");
  const { error: delGuadalupe } = await supabase.from('members').delete().eq('church_id', GUADALUPE);
  if (delGuadalupe) console.error("Error deleting Guadalupe members:", delGuadalupe);
  else console.log("Guadalupe members deleted successfully.");

  // 2. FETCH ALL SITIO AND SANTO MEMBERS
  let allSitioSanto = [];
  let page = 0;
  while(true) {
    const { data } = await supabase.from('members').select('*').in('church_id', [SITIO, SANTO]).range(page*1000, (page+1)*1000 - 1);
    if(data && data.length > 0) {
       allSitioSanto = allSitioSanto.concat(data);
       if(data.length < 1000) break;
       page++;
    } else break;
  }

  // 3. FILTER VISITORS
  const visitorsToMigrate = allSitioSanto.filter(m => 
    (m.function && m.function.toLowerCase().includes('visitante')) || 
    (m.status && m.status.toLowerCase().includes('visitante')) ||
    (m.status === 'em_conversao') ||
    (m.status === 'pendente')
  );

  console.log(`Found ${visitorsToMigrate.length} visitors to migrate from Sítio/Santo Amaro.`);

  if (visitorsToMigrate.length > 0) {
    // 4. MAP TO VISITORS TABLE SCHEMA
    const newVisitors = visitorsToMigrate.map(m => ({
      id: crypto.randomUUID(),
      church_id: m.church_id,
      name: m.name,
      phone: m.phone,
      date: m.created_at,
      address: m.address,
      status: 'visitante',
      wants_visit: false,
      how_knew_church: m.ministry || 'Desconhecido',
      region: m.state || 'Desconhecida'
    }));

    // 5. INSERT INTO VISITORS
    const { error: insErr } = await supabase.from('visitors').insert(newVisitors);
    if (insErr) {
       console.error("Error inserting visitors:", insErr);
       return;
    }
    console.log(`Successfully migrated ${newVisitors.length} into visitors table.`);

    // 6. DELETE FROM MEMBERS
    const idsToDelete = visitorsToMigrate.map(m => m.id);
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batchIds = idsToDelete.slice(i, i + 50);
      const { error: delErr } = await supabase.from('members').delete().in('id', batchIds);
      if (delErr) console.error("Error deleting migrated members:", delErr);
    }
    console.log("Successfully deleted migrated visitors from members table.");
  }
}

run().catch(console.error);
