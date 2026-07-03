const fs = require('fs');

const filesToFix = [
  {
    path: 'app/departamentos/kids/page.tsx',
    regex: /const texto = `[^`]+`;/g,
    replacement: 'const texto = `\\uD83E\\uDDF8 *Escala do Ministério Kids*\\n\\uD83D\\uDCC5 ${mes}\\n\\n\\uD83D\\uDC49 Confira a sua escala:\\n${url}`;'
  },
  {
    path: 'app/departamentos/louvor/page.tsx',
    regex: /const texto = `[^`]+`;/g,
    replacement: 'const texto = `\\uD83C\\uDFB5 *Escala do Ministério de Louvor*\\n\\uD83D\\uDCC5 ${mes}\\n\\n\\uD83D\\uDC49 Confira a sua escala:\\n${url}`;'
  },
  {
    path: 'app/departamentos/midia/page.tsx',
    regex: /const texto = `[^`]+`;/g,
    replacement: 'const texto = `\\uD83D\\uDEF0 *Escala da Mídia*\\n\\uD83D\\uDCC5 ${mes}\\n\\n\\uD83D\\uDC49 Confira a sua escala:\\n${url}`;'
  },
  {
    path: 'app/departamentos/obreiros/page.tsx',
    regex: /const texto = `[^`]+`;/g,
    replacement: 'const texto = `\\uD83E\\uDD1D *Escala de Obreiros*\\n\\uD83D\\uDCC5 ${mes}\\n\\n\\uD83D\\uDC49 Confira a sua escala:\\n${url}`;'
  }
];

filesToFix.forEach(({ path, regex, replacement }) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync(path, content, 'utf8');
      console.log('Fixed', path);
    } else {
      console.log('Regex did not match for', path);
    }
  } else {
    console.log('File not found:', path);
  }
});
