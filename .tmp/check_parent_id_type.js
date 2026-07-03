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
    // Run a query on pg_attribute or cast check
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT data_type FROM information_schema.columns WHERE table_name = 'kids' AND column_name = 'parent_id';"
    });
    console.log('Result:', data);
    console.log('Error:', error);
}
run();
