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
    // Try listing columns by attempting to insert a broken object to see the pg error
    const { data, error } = await supabase.from('kids').insert({
        id: '00000000-0000-0000-0000-000000000000',
        invalid_column_name_test: 'TEST'
    });
    console.log('ERROR:', error);
}
run();
