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
    // Select column metadata from user_roles / members to see constraints or structure
    const { data: cols, error } = await supabase.from('members').select('id').limit(1);
    console.log('Sample member ID format:', cols?.[0]?.id);
}
run();
