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
    const { data, error } = await supabase.from('kids').insert({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Check Schema Kid 2',
        birth_date: '2018-07-14'
    }).select();
    console.log('Result:', data);
    console.log('Error:', error);
}
run();
