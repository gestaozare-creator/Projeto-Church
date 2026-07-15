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
  const { data, error } = await supabase.from('events').select('*').limit(1);
  if (error) {
     console.error("Error fetching events:", error);
  } else {
     console.log("Events columns:", data.length > 0 ? Object.keys(data[0]) : "No rows");
  }
  
  // Try to insert a dummy event and catch exact error
  const { error: insErr } = await supabase.from('events').insert({
    title: 'Teste',
    type: 'culto',
    date: '2026-06-23',
    start_time: '19:30',
    location: 'Templo Principal',
    is_global: false,
    church_id: '1782771173659'
  });
  console.log("Insert Test Result:", insErr ? insErr.message : "Success");
}
run();
