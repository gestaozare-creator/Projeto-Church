const fs = require('fs');
const rule = `
### 9. Sincronia de Campos (Formulários Públicos vs Modais Internos)
* **Regra**: Todo e qualquer novo campo de cadastro adicionado aos modais internos da Secretaria (ex: \`app/dashboard-secretaria/page.tsx\` ou \`app/visitantes/page.tsx\`) DEVE OBRIGATORIAMENTE ser refletido e atualizado também nos formulários públicos de auto-cadastro (\`app/formulario/page.tsx\` para visitantes e \`app/formulario-membro/page.tsx\` para membros). O inverso também é válido. O objetivo é manter os canais de entrada de dados totalmente sincronizados arquiteturalmente.
`;
fs.appendFileSync('.agents/AGENTS.md', rule);
console.log('Rule appended.');
