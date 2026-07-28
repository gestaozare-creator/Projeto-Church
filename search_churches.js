const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('from("churches")') || content.includes("from('churches')") || content.includes("from(`churches`)")) {
        console.log(fullPath);
      }
    }
  }
}

walk('E:\\\\Projeto Church\\\\app');
walk('E:\\\\Projeto Church\\\\hooks');
