const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envStr.split('\n').forEach(line => {
    if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function run() {
    // Check church IDs
    const { data: churches } = await supabase.from('churches').select('id, name');
    console.log('CHURCHES:', churches);
    
    // Check the members table to see what church_id they're assigned to
    const { data: members } = await supabase.from('members').select('id, name, church_id').limit(3);
    console.log('MEMBERS (3):', members);
    
    // Check users to see what church_id they have
    const { data: users } = await supabase.from('users').select('id, email, church_id').limit(3);
    console.log('USERS (3):', users);
}
run();
