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

async function geocode(address) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Geocoding failed for", address);
  }
  return null;
}

async function run() {
  const { data: churches } = await supabase.from('churches').select('*');
  
  for (const c of churches) {
    let fullAddr = c.address;
    if (c.name.includes("Guadalupe")) {
      fullAddr = "R. José Loureiro, 773 - Centro, Curitiba - PR";
    } else if (c.name.includes("Santo Amaro")) {
      fullAddr = "Rua Paulo Eiró, 79 - Santo Amaro, São Paulo - SP";
    } else if (c.name.includes("Sítio Cercado")) {
      fullAddr = "R. Quitandinha, 658 - Sítio Cercado, Curitiba - PR";
    }
    
    console.log(`Geocoding ${c.name}: ${fullAddr}`);
    const coords = await geocode(fullAddr);
    
    if (coords) {
      console.log(`  Found coords for ${c.name}:`, coords);
      let config = {};
      try {
        config = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
      } catch(e) {}
      
      if (!config.geocache) config.geocache = {};
      
      // Store under the exact string that will be used as `churchAddress`
      config.geocache[fullAddr] = coords;
      
      await supabase.from('churches').update({ 
        address: fullAddr,
        config: JSON.stringify(config) 
      }).eq('id', c.id);
      console.log(`  Updated ${c.name} in DB.`);
    } else {
      console.log(`  Could not find coords for ${fullAddr}`);
    }
  }
}
run();
