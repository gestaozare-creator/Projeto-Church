const xlsx = require('xlsx');

const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Dados Financeiro Igreja Santo amaro.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

const receitas = new Set();
const despesas = new Set();
const sideTable = {};

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row) continue;
  
  if (row[12] && row[13]) {
     sideTable[row[12]] = row[13];
  }

  const type = String(row[1]).trim().toUpperCase();
  const cat = row[4];

  if (type === 'RECEBIMENTO' && cat) receitas.add(cat);
  if (type === 'DESPESA' && cat) despesas.add(cat);
}

console.log("=== RECEITAS ===");
console.log(Array.from(receitas));

console.log("\n=== DESPESAS ===");
console.log(Array.from(despesas));

console.log("\n=== SIDE TABLE ===");
console.log(sideTable);
