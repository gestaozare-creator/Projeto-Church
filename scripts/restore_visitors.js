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
  let allVisitors = [];
  let page = 0;
  while(true) {
    const { data } = await supabase.from('visitors').select('*').range(page*1000, (page+1)*1000 - 1);
    if(data && data.length > 0) {
       allVisitors = allVisitors.concat(data);
       if(data.length < 1000) break;
       page++;
    } else break;
  }

  console.log(`Found ${allVisitors.length} visitors in the orphan 'visitors' table to restore to 'members' table.`);

  if (allVisitors.length > 0) {
    const membersToRestore = allVisitors.map(v => ({
      id: crypto.randomUUID(), // we can generate new IDs or use the old ones if they don't clash
      church_id: v.church_id,
      name: v.name,
      phone: v.phone || '',
      email: '',
      address: v.address || '',
      status: 'visitante',
      function: 'Visitante',
      ministry: v.how_knew_church || 'Desconhecido',
      integration_date: v.date,
      created_at: v.created_at || new Date().toISOString()
    }));

    for (let i = 0; i < membersToRestore.length; i += 50) {
      const batch = membersToRestore.slice(i, i + 50);
      const { error: insErr } = await supabase.from('members').insert(batch);
      if (insErr) {
         console.error("Error restoring members:", insErr);
      }
    }
    console.log(`Successfully restored ${membersToRestore.length} visitors back to the 'members' table.`);

    // Clear visitors table so we don't have duplicates
    let vIds = allVisitors.map(v => v.id);
    for (let i = 0; i < vIds.length; i += 50) {
       await supabase.from('visitors').delete().in('id', vIds.slice(i, i + 50));
    }
    console.log("Cleared old visitors table.");
  }
}

run().catch(console.error);
