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
    // Query pg_attribute to get the kids table column names
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'kids';"
    });
    console.log('Columns:', data);
    console.log('Error:', error);
}
run();
