const fs = require('fs');
const path = require('path');

const files = [
  'app/page.tsx',
  'app/agenda/page.tsx',
  'app/dashboard-secretaria/page.tsx',
  'app/departamentos/kids/page.tsx',
  'app/departamentos/louvor/page.tsx',
  'app/departamentos/midia/page.tsx',
  'app/departamentos/obreiros/page.tsx',
  'app/financeiro/page.tsx',
  'app/financeiro/pagar/page.tsx',
  'app/financeiro/receber/page.tsx',
  'app/visitantes/page.tsx'
];

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace start date
    content = content.replace(/new Date\(d\.getFullYear\(\),\s*d\.getMonth\(\),\s*1\)/g, 'new Date(d.getFullYear(), 0, 1)');
    // Replace end date
    content = content.replace(/new Date\(d\.getFullYear\(\),\s*d\.getMonth\(\)\s*\+\s*1,\s*0\)/g, 'new Date(d.getFullYear(), 11, 31)');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedCount++;
      console.log(`Updated ${file}`);
    } else {
      console.log(`No match in ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log(`\nFinished updating ${updatedCount} files.`);
