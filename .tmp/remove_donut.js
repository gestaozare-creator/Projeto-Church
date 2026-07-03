const fs = require('fs');
const path = require('path');

const curPath = path.join(__dirname, '..', 'app', 'dashboard-secretaria', 'page.tsx');
let curContent = fs.readFileSync(curPath, 'utf8');

curContent = curContent.replace(
  /function DonutChart\(\{ title, data, total \}: \{ title: string; data: \{ key: string; label: string; value: number; color: string \}\[\]; total: number \}\) \{[\s\S]*?return \([\s\S]*?\}\);\n\}/,
  ''
);

fs.writeFileSync(curPath, curContent, 'utf8');
console.log("DonutChart removed");
