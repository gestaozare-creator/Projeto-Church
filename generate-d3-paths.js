const fs = require('fs');
const d3Geo = require('d3-geo');

const geojsonStr = fs.readFileSync('brazil-states.json', 'utf8');
const geojson = JSON.parse(geojsonStr);

// We want to project the map onto a 500x500 box (or whatever fits Brazil nicely)
const width = 500;
const height = 500;
const projection = d3Geo.geoMercator().fitSize([width, height], geojson);
const pathGenerator = d3Geo.geoPath().projection(projection);

const STATE_CODES = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
  "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
  "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
  "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
  "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
};

const data = {};

geojson.features.forEach(feature => {
  const name = feature.properties.name || feature.properties.NM_ESTADO;
  const uf = STATE_CODES[name];
  if (!uf) return;
  
  // get raw SVG path
  let pathStr = pathGenerator(feature);
  // round to 1 decimal place to save huge amount of bytes
  pathStr = pathStr.replace(/(\.\d)\d+/g, '$1');
  
  // calculate centroid for label
  const centroid = pathGenerator.centroid(feature);
  const labelX = Math.round(centroid[0]);
  const labelY = Math.round(centroid[1]);
  
  data[uf] = {
    name,
    path: pathStr,
    labelX,
    labelY
  };
});

let out = `export const BRAZIL_STATES: Record<string, { name: string; path: string; labelX: number; labelY: number }> = {\n`;
Object.entries(data).forEach(([id, obj]) => {
  out += `  ${id}: { name: '${obj.name}', path: '${obj.path}', labelX: ${obj.labelX}, labelY: ${obj.labelY} },\n`;
});
out += `};\n`;

fs.writeFileSync('lib/brazil-map-data.ts', out);
console.log("Updated brazil-map-data.ts! Found", Object.keys(data).length, "states.");
