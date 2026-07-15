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
  console.log("Fetching members with phones...");
  let page = 0;
  const pageSize = 1000;
  let allMembers = [];
  
  while (true) {
    const { data, error } = await supabase
      .from('members')
      .select('id, phone')
      .not('phone', 'is', null)
      .neq('phone', '')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    
    if (!data || data.length === 0) break;
    allMembers = [...allMembers, ...data];
    if (data.length < pageSize) break;
    page++;
  }
  
  console.log(`Found ${allMembers.length} members with phones.`);
  
  let updatedCount = 0;
  for (let m of allMembers) {
    if (!m.phone) continue;
    const digitsOnly = m.phone.replace(/\D/g, '');
    if (digitsOnly !== m.phone) {
      // It has non-digits, update it
      const { error } = await supabase.from('members').update({ phone: digitsOnly }).eq('id', m.id);
      if (error) {
         console.error(`Failed to update ${m.id}:`, error.message);
      } else {
         updatedCount++;
      }
    }
  }
  
  console.log(`Formatted ${updatedCount} phones.`);
}
run();
