const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/LucasBassetti/mapa-brasil-svg/master/mapa-brasil.svg';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // We expect the svg to have paths like <path id="SP" d="..." />
    // or maybe <g id="SP"><path d="..."/></g>
    console.log("SVG size: ", data.length);
    fs.writeFileSync('mapa-brasil.svg', data);
    console.log("Saved to mapa-brasil.svg");
  });
});
