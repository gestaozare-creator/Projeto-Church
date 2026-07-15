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
  const { data: v } = await supabase.from('visitors').select('*').limit(10);
  console.log("Sample visitors table rows:", v);
  
  const { data: m } = await supabase.from('members').select('*').limit(10);
  console.log("Sample members table rows:", m);
  
  // Also count exact grouped by church_id and type if applicable
  const { data: allV } = await supabase.from('visitors').select('id, church_id, status, name');
  console.log(`Total visitors table: ${allV ? allV.length : 0}`);
  
  if (allV) {
    const byChurch = {};
    allV.forEach(row => {
       byChurch[row.church_id] = (byChurch[row.church_id] || 0) + 1;
    });
    console.log("Visitors table counts by church:", byChurch);
  }
}

run().catch(console.error);
