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
  const { data: ch } = await supabase.from('churches').select('*');
  const c = ch.find(x => x.is_headquarters) || ch[0];
  const conf = typeof c.config === 'string' ? JSON.parse(c.config) : (c.config || {});
  
  const { data: m } = await supabase.from('members').select('address').limit(10);
  console.log("Member addresses:", m.map(x => x.address));
  if (conf.geocache) {
     const addr = m[0].address ? m[0].address.trim() : '';
     console.log("Is first address in geocache?", !!conf.geocache[addr], conf.geocache[addr]);
  }
}
run();
