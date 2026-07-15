const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        searchFiles(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('supabase.from')) {
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('supabase.from')) {
             console.log(`${fullPath}:${i+1} => ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles('E:\\Projeto Church');
