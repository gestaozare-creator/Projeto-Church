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
  const { data: churches } = await supabase.from('churches').select('id, name');
  console.log("Churches:");
  console.table(churches);

  const { data: members } = await supabase.from('members').select('id, church_id, type');
  const { data: visitors } = await supabase.from('visitors').select('id, church_id');
  const { data: general } = await supabase.from('people').select('id, church_id, type');

  console.log("Total members table:", members ? members.length : 0);
  console.log("Total visitors table:", visitors ? visitors.length : 0);
  console.log("Total people table:", general ? general.length : 0);
  
  if (members && members.length > 0) {
     const counts = {};
     members.forEach(m => {
        counts[m.church_id] = (counts[m.church_id] || 0) + 1;
     });
     console.log("Members by church:");
     console.table(counts);
     
     // Sample some members from Guadalupe
     const guada = churches.find(c => c.name.includes('Guadalupe'));
     if (guada) {
       console.log("Sample members in Guadalupe:", members.filter(m => m.church_id === guada.id).slice(0, 3));
     }
  }

  if (visitors && visitors.length > 0) {
     const counts = {};
     visitors.forEach(m => {
        counts[m.church_id] = (counts[m.church_id] || 0) + 1;
     });
     console.log("Visitors by church:");
     console.table(counts);
  }
}

run().catch(console.error);
