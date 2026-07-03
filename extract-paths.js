const fs = require('fs');
const html = fs.readFileSync('rendered-map.html', 'utf8');

// Looking for <path id="SP" d="M..." ... />
const paths = html.match(/<path[^>]+>/g);

const data = {};
const viewBoxMatch = html.match(/viewBox="([^"]+)"/);

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

paths.forEach(pTag => {
  const idMatch = pTag.match(/id="([A-Z]{2})"/);
  const dMatch = pTag.match(/d="([^"]+)"/);
  const titleMatch = pTag.match(/title="([^"]+)"/); // sometimes they put title
  
  if (idMatch && dMatch) {
    const id = idMatch[1];
    const d = dMatch[1];
    
    // basic bounding box approximation to find center
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
      name: id,
      path: d,
      labelX: Math.round(labelX),
      labelY: Math.round(labelY)
    };
  }
});

let out = `export const BRAZIL_STATES: Record<string, { name: string; path: string; labelX: number; labelY: number }> = {\n`;
Object.entries(data).forEach(([id, obj]) => {
  out += `  ${id}: { name: '${obj.name}', path: '${obj.path}', labelX: ${obj.labelX}, labelY: ${obj.labelY} },\n`;
});
out += `};\n`;

fs.writeFileSync('lib/brazil-map-data.ts', out);
console.log("Updated brazil-map-data.ts!");
console.log("Found states:", Object.keys(data).length);
console.log("ViewBox:", viewBoxMatch ? viewBoxMatch[1] : null);
