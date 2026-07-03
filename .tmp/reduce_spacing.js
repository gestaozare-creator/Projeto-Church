const fs = require('fs');
const path = require('path');

const curPath = path.join(__dirname, '..', 'app', 'dashboard-secretaria', 'page.tsx');
let curContent = fs.readFileSync(curPath, 'utf8');

// page-wrapper paddingBottom
curContent = curContent.replace(
  'paddingBottom: "30px"',
  'paddingBottom: "10px"'
);

// page-wrapper paddingBottom (if it was single quotes somehow)
curContent = curContent.replace(
  "paddingBottom: '30px'",
  "paddingBottom: '10px'"
);

// FILTROS SUPERIORES marginBottom
curContent = curContent.replace(
  'marginBottom: "20px",\n        }}\n      >\n        {canSeeAllChurches',
  'marginBottom: "12px",\n        }}\n      >\n        {canSeeAllChurches'
);

// KPIS PRINCIPAIS marginBottom
curContent = curContent.replace(
  'marginBottom: "25px",\n        }}\n      >\n        <div\n          className="glass"',
  'marginBottom: "15px",\n        }}\n      >\n        <div\n          className="glass"'
);

// KPI paddings (4 times)
curContent = curContent.replace(
  /padding: "20px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #3498db"/g,
  'padding: "12px 16px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #3498db"'
);
curContent = curContent.replace(
  /padding: "20px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #2ecc71"/g,
  'padding: "12px 16px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #2ecc71"'
);
curContent = curContent.replace(
  /padding: "20px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #f1c40f"/g,
  'padding: "12px 16px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #f1c40f"'
);
curContent = curContent.replace(
  /padding: "20px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #e74c3c"/g,
  'padding: "12px 16px",\n            borderRadius: "14px",\n            borderLeft: "4px solid #e74c3c"'
);

// GRÁFICOS MINISTÉRIOS E FUNÇÕES marginBottom
curContent = curContent.replace(
  'marginBottom: "25px",\n        }}\n      >\n        {/* Gráfico de Ministérios */}',
  'marginBottom: "15px",\n        }}\n      >\n        {/* Gráfico de Ministérios */}'
);

// FUNIL DE CONVERSÃO marginBottom
curContent = curContent.replace(
  'marginBottom: "25px",\n        }}\n      >\n        <div\n          className="glass"',
  'marginBottom: "15px",\n        }}\n      >\n        <div\n          className="glass"'
);

fs.writeFileSync(curPath, curContent, 'utf8');
console.log('Spacings adjusted successfully.');
