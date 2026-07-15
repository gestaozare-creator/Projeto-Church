const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});
if(!supabaseKey){
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('churches').select('id, name, address, city, neighborhood, config');
  if (error) {
     console.error(error);
  } else {
     data.forEach(c => {
        const config = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
        const geoKeys = Object.keys(config.geocache || {});
        console.log(`Church: ${c.name}`);
        console.log(` Address: ${c.address}`);
        console.log(` City: ${c.city}, Neighborhood: ${c.neighborhood}`);
        console.log(` Geocache keys count: ${geoKeys.length}`);
     });
  }
}
run();
