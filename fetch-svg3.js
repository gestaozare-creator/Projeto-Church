const https = require('https');
const fs = require('fs');

const url = 'https://unpkg.com/@svg-maps/brazil@1.0.1/map.svg';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('mapa3.svg', data);
    console.log("SVG size: ", data.length);
  });
});
