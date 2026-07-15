const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: visitors, error: getErr } = await supabase.from('visitors').select('*');
  if (getErr) {
    console.error('Error fetching visitors:', getErr);
    return;
  }
  
  if (!visitors || visitors.length === 0) {
    console.log('No visitors found to migrate.');
    return;
  }
  
  console.log(`Migrating ${visitors.length} visitors to members table...`);
  
  let toInsert = visitors.map(v => ({
    church_id: v.church_id,
    name: v.name,
    phone: v.phone || '',
    state: v.region || 'Geral',
    ministry: v.how_knew_church || 'Outros',
    address: v.address || '',
    integration_date: v.date,
    status: v.status === 'membro' ? 'ativo' : v.status === 'em_conversao' ? 'em_conversao' : 'pendente',
    function: 'Visitante'
  }));
  
  let successCount = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await supabase.from('members').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      successCount += batch.length;
    }
  }
  
  console.log(`Inserted ${successCount} into members.`);
  
  if (successCount > 0) {
    // Delete from visitors table
    const { error: delErr } = await supabase.from('visitors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) {
      console.error('Error deleting from visitors:', delErr);
    } else {
      console.log('Cleared visitors table.');
    }
  }
}

run();
