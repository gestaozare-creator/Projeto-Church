const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('brazil-states.json', data);
    console.log("JSON size: ", data.length);
  });
}).on('error', err => console.log(err.message));
