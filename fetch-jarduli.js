const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/LuizJarduli/brazil-map/master/src/components/Map.jsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('LuizJarduli-Map.jsx', data);
    console.log("Size: ", data.length);
  });
});
