const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching churches...");
  const { data: churches } = await supabase.from('churches').select('*');
  
  // Create a unified cache from all churches
  const cache = {};
  churches.forEach(c => {
    try {
      const config = typeof c.config === 'string' ? JSON.parse(c.config) : (c.config || {});
      if (config.geocache) {
        Object.assign(cache, config.geocache);
      }
    } catch(e) {}
  });

  let cacheUpdated = false;

  console.log("Fetching all members to get unique addresses...");
  let allMembers = [];
  let page = 0;
  while(true){
    let { data } = await supabase.from('members').select('address').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    allMembers = [...allMembers, ...data];
    if (data.length < 1000) break;
    page++;
  }

  const addresses = new Set();
  allMembers.forEach(m => {
    let addr = m.address ? m.address.trim() : '';
    if (addr && addr.toLowerCase() !== 'não informado') {
      addresses.add(addr);
    }
  });

  console.log(`Found ${addresses.size} unique addresses.`);
  
  let i = 0;
  for (const address of addresses) {
    i++;
    if (cache[address] !== undefined) continue;

    let searchQuery = address;
    const lowerQ = searchQuery.toLowerCase();
    if (!lowerQ.includes('curitiba') && !lowerQ.includes('pr') && !lowerQ.includes('são paulo') && !lowerQ.includes('sao paulo') && !lowerQ.match(/\bsp\b/)) {
       searchQuery += ', Curitiba';
    }

    console.log(`[${i}/${addresses.size}] Geocoding: ${searchQuery}`);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        cache[address] = { lat, lng: lon };
        cacheUpdated = true;
        console.log(` -> Found: ${lat}, ${lon}`);
      } else {
        cache[address] = null;
        cacheUpdated = true;
        console.log(` -> Not found`);
      }
    } catch(e) {
      console.error(` -> Error geocoding ${searchQuery}:`, e.message);
    }
    
    await new Promise(r => setTimeout(r, 600)); // Photon is more lenient, 600ms is safe
  }

  if (cacheUpdated) {
    console.log("Updating database with new geocache for ALL churches...");
    for (const c of churches) {
      let config = {};
      try { config = typeof c.config === 'string' ? JSON.parse(c.config) : (c.config || {}); } catch(e) {}
      config.geocache = cache;
      await supabase.from('churches').update({ config: JSON.stringify(config) }).eq('id', c.id);
    }
    console.log("Geocache updated successfully on all churches.");
  } else {
    console.log("No new addresses to geocode.");
  }
}

run();
