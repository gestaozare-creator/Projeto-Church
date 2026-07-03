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
    // Attempt inserting with parent_id as m_1783094082154 to see if it triggers type uuid error or FKEY constraint error.
    // FKEY constraint error would be "violates foreign key constraint".
    // Type UUID error is "invalid input syntax for type uuid".
    const { error } = await supabase.from('kids').insert({
        id: '99999999-9999-9999-9999-999999999999',
        name: 'Test Schema Parent ID',
        birth_date: '2020-01-01',
        parent_id: 'm_1783094082154'
    });
    console.log('Error message details:', error);
}
run();
