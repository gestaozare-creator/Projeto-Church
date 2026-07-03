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
    // Attempt inserting with parent_id set to null to verify if parent_id is nullable (which we saw it is!).
    // And if it succeeds, it means parent_id: null is totally fine.
    const { data, error } = await supabase.from('kids').insert({
        id: '88888888-8888-8888-8888-888888888888',
        name: 'Test Schema Parent ID Null',
        birth_date: '2020-01-01',
        parent_id: null,
        emergency_contact: '41991757815'
    }).select();
    console.log('Result:', data);
    console.log('Error:', error);
    
    // Clean up
    await supabase.from('kids').delete().eq('id', '88888888-8888-8888-8888-888888888888');
}
run();
