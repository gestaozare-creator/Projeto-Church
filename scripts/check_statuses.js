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
  const { error } = await supabase.from('transactions').update({ status: 'confirmado' }).eq('status', 'pago');
  if (error) console.error(error);
  else console.log("Updated 'pago' to 'confirmado'");
}
run();
