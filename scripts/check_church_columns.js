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
  const { data: churches } = await supabase.from('churches').select('*');
  if(churches && churches.length > 0) {
      console.log("Keys available in churches table:", Object.keys(churches[0]));
      churches.forEach(c => {
         console.log(`\nChurch: ${c.name}`);
         console.log(`logo_url:`, c.logo_url ? c.logo_url.substring(0, 30) + '...' : null);
         console.log(`banner_url (if any):`, c.banner_url ? c.banner_url.substring(0, 30) + '...' : 'undefined');
         const config = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
         console.log(`config keys:`, Object.keys(config));
         if(config.header_url || config.app_header || config.cover_photo || config.capa) {
             console.log(`Found image in config!`);
         }
      });
  }
}
run();
