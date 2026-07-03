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
    // Attempt insert with standard postgres schema column names to see which ones are accepted.
    // Try sending just 'id' (uuid format) and 'name', and check constraint errors for others
    const { data, error } = await supabase.from('kids').insert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Check Schema Kid'
    }).select();
    console.log('Result:', data);
    console.log('Error:', error);
}
run();
