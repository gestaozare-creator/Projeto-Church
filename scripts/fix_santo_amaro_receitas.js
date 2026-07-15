const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Get Santo Amaro Church
  const { data: churches } = await supabase.from('churches').select('*');
  const santoAmaro = churches.find(c => c.name.toLowerCase().includes('santo amaro'));
  if (!santoAmaro) throw new Error("Church Santo Amaro not found");
  
  // Find pending receitas for Santo Amaro
  const { data: pendingReceitas, error: selErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('church_id', santoAmaro.id)
    .eq('type', 'receita')
    .eq('status', 'pendente');
    
  if (selErr) {
    console.error("Error fetching pending receitas:", selErr);
    return;
  }
  
  console.log(`Found ${pendingReceitas.length} pending receitas for Santo Amaro. Updating to confirmado...`);
  
  if (pendingReceitas.length === 0) return;

  const updatePromises = pendingReceitas.map(tx => {
    return supabase.from('transactions').update({
      status: 'confirmado',
      paid_date: tx.date || tx.due_date || new Date().toISOString().split('T')[0]
    }).eq('id', tx.id);
  });
  
  await Promise.all(updatePromises);
  
  console.log("Update completed successfully!");
}

run().catch(console.error);
