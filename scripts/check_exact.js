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
    const { data, error } = await supabase.from('members').select('id, church_id').range(page*1000, (page+1)*1000 - 1);
    if(error) console.log("Error members:", error);
    if(data && data.length > 0) {
       allMembers = allMembers.concat(data);
       if(data.length < 1000) break;
       page++;
    } else break;
  }
  
  let allVisitors = [];
  page = 0;
  while(true) {
    const { data, error } = await supabase.from('visitors').select('id, church_id').range(page*1000, (page+1)*1000 - 1);
    if(error) console.log("Error visitors:", error);
    if(data && data.length > 0) {
       allVisitors = allVisitors.concat(data);
       if(data.length < 1000) break;
       page++;
    } else break;
  }
  
  const mByChurch = {};
  allMembers.forEach(m => mByChurch[m.church_id] = (mByChurch[m.church_id] || 0) + 1);
  const vByChurch = {};
  allVisitors.forEach(v => vByChurch[v.church_id] = (vByChurch[v.church_id] || 0) + 1);
  
  console.log("Total Members:", allMembers.length, mByChurch);
  console.log("Total Visitors:", allVisitors.length, vByChurch);
}

run().catch(console.error);
