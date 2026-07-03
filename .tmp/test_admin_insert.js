const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envStr.split('\n').forEach(line => {
    if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(url, key);

async function run() {
    const tempKidId = '00000000-0000-0000-0000-' + Math.floor(100000000000 + Math.random() * 900000000000);
    const { data: newKid, error } = await supabaseAdmin
      .from('kids')
      .insert({
        id: tempKidId,
        name: 'Test Admin Insert',
        birth_date: '2020-01-01',
        parent_id: null,
        emergency_contact: 'Test Parent | 123456789',
        allergies: 'Sem alergias'
      })
      .select()
      .single();

    console.log('Admin Insert Result:', newKid);
    console.log('Admin Insert Error:', error);
    
    if (newKid) {
        await supabaseAdmin.from('kids').delete().eq('id', tempKidId);
    }
}
run();
