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
    // Try inserting a dummy row with all possible columns to see which exist
    const { data, error } = await supabase.from('kids').select('*').limit(1);
    console.log('KIDS columns (from sample):', data);
    console.log('ERROR:', error);
    
    // Also try inserting to see the schema
    const { error: err2 } = await supabase.from('kids').insert({
        id: 'test_delete_me',
        name: 'TEST'
    });
    console.log('Insert test error:', err2?.message || 'success');
    
    // Clean up
    await supabase.from('kids').delete().eq('id', 'test_delete_me');
}
run();
