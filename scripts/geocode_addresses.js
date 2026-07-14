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
  const hq = churches.find(c => c.is_headquarters) || churches[0];
  let config = {};
  try {
    config = typeof hq.config === 'string' ? JSON.parse(hq.config) : (hq.config || {});
  } catch(e) {}
  
  if (!config.geocache) config.geocache = {};
  const cache = config.geocache;
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
    if (!searchQuery.toLowerCase().includes('curitiba') && !searchQuery.toLowerCase().includes('pr')) {
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
    console.log("Updating church config geocache in Supabase...");
    await supabase.from('churches').update({ config: JSON.stringify(config) }).eq('id', hq.id);
    console.log("Done!");
  } else {
    console.log("No new addresses to geocode.");
  }
}

run();
