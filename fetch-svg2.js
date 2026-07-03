const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/wgenial/mapa-brasil/master/brasil.svg';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('mapa2.svg', data);
    console.log("SVG size: ", data.length);
  });
});
