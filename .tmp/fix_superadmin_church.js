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
    // Update the superadmin user to have the church_id
    const { error } = await supabase
        .from('user_roles')
        .update({ church_id: '1782771173659' })
        .eq('id', '07773a29-d843-454c-95ca-54dae7e021a0');
    
    if (error) {
        console.log('ERROR updating user_roles:', error);
    } else {
        console.log('SUCCESS: Updated superadmin church_id to 1782771173659');
    }
    
    // Verify
    const { data } = await supabase.from('user_roles').select('id, email, church_id');
    console.log('AFTER UPDATE:', data);
}
run();
