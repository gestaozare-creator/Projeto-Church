const fs = require('fs');
const html = fs.readFileSync('rendered-map.html', 'utf8');

// The structure is <a id="UF"><title>Name</title><path d="..." />...</a>
// Let's use a simple split or regex to capture each <a> group.
const aTags = html.split('<a ');

const data = {};
let viewBoxMatch = html.match(/viewBox="([^"]+)"/);

aTags.forEach(group => {
  const idMatch = group.match(/^id="([A-Z]{2})"/);
  const dMatch = group.match(/<path[^>]*d="([^"]+)"/);
  const titleMatch = group.match(/<title>([^<]+)<\/title>/);
  
  if (idMatch && dMatch) {
    const id = idMatch[1];
    const d = dMatch[1];
    const name = titleMatch ? titleMatch[1] : id;
    
    // approximate center for label
    const coords = d.match(/-?\d+(\.\d+)?/g);
    let lx=Infinity, ly=Infinity, hx=-Infinity, hy=-Infinity;
    if (coords) {
       for(let i=0; i<coords.length; i+=2) {
         const x = parseFloat(coords[i]);
         const y = parseFloat(coords[i+1]);
         if (!isNaN(x) && !isNaN(y)) {
           if (x < lx) lx = x;
           if (x > hx) hx = x;
           if (y < ly) ly = y;
           if (y > hy) hy = y;
         }
       }
    }
    const labelX = (lx + hx)/2;
    const labelY = (ly + hy)/2;
    
    data[id] = {
      name,
      path: d,
      labelX: Math.round(labelX),
      labelY: Math.round(labelY)
    };
  }
});

let out = `// Real map paths parsed from react-brazil-map\n`;
out += `export const BRAZIL_STATES: Record<string, { name: string; path: string; labelX: number; labelY: number }> = {\n`;
Object.entries(data).forEach(([id, obj]) => {
  out += `  ${id}: { name: '${obj.name}', path: '${obj.path.replace(/\s+/g, ' ')}', labelX: ${obj.labelX}, labelY: ${obj.labelY} },\n`;
});
out += `};\n`;

fs.writeFileSync('lib/brazil-map-data.ts', out);
console.log("Updated brazil-map-data.ts!");
console.log("Found states:", Object.keys(data).length);
console.log("ViewBox:", viewBoxMatch ? viewBoxMatch[1] : null);
