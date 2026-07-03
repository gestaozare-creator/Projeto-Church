const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, '..', 'hooks', 'useChurches.ts');
let content = fs.readFileSync(hookPath, 'utf8');

content = content.replace(
  /activeModules: c\.active_modules \|\| \['secretaria', 'financeiro', 'departamentos'\],/,
  `activeModules: c.active_modules || ['secretaria', 'financeiro', 'departamentos'],
              cardConfig: c.card_config ? (typeof c.card_config === 'string' ? JSON.parse(c.card_config) : c.card_config) : { primaryColor: '#3498db', showLogo: true, showSignature: false, customDisclaimer: 'Este documento é de uso exclusivo do membro.' },
              config: c.config ? (typeof c.config === 'string' ? JSON.parse(c.config) : c.config) : null,`
);

fs.writeFileSync(hookPath, content, 'utf8');
console.log('useChurches hook updated to parse cardConfig');
