const fs = require('fs');
const path = require('path');

function addImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the required imports right below the "use client"; line
  if (!content.includes('toPng')) {
    content = content.replace('"use client";\n', '"use client";\n\nimport { toPng } from "html-to-image";\nimport download from "downloadjs";\nimport { useRef } from "react";\n');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
addImports(path.join(basePath, 'louvor', 'page.tsx'));
addImports(path.join(basePath, 'midia', 'page.tsx'));
addImports(path.join(basePath, 'obreiros', 'page.tsx'));

console.log('Imports added successfully.');
