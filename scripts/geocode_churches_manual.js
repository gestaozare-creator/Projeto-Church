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

const coordsMap = {
  "Guadalupe": { lat: -25.43389, lng: -49.26611, addr: "R. José Loureiro, 773 - Centro, Curitiba - PR" },
  "Santo Amaro SP": { lat: -23.65215, lng: -46.70513, addr: "Rua Paulo Eiró, 79 - Santo Amaro, São Paulo - SP" },
  "Sítio Cercado": { lat: -25.53930, lng: -49.27411, addr: "R. Quitandinha, 658 - Sítio Cercado, Curitiba - PR" }
};

async function run() {
  const { data: churches } = await supabase.from('churches').select('*');
  
  for (const c of churches) {
    const geo = coordsMap[c.name];
    if (geo) {
      let config = {};
      try {
        config = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
      } catch(e) {}
      
      if (!config.geocache) config.geocache = {};
      
      config.geocache[geo.addr] = { lat: geo.lat, lng: geo.lng };
      
      await supabase.from('churches').update({ 
        address: geo.addr,
        config: JSON.stringify(config) 
      }).eq('id', c.id);
      console.log(`Updated ${c.name} with fixed coordinates.`);
    }
  }
}
run();
