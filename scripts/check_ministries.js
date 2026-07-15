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
  const { data: ministries } = await supabase.from('ministries').select('*');
  console.log(ministries);
}
run();
