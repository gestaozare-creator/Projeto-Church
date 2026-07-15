const xlsx = require('xlsx');

const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Dados Financeiro Igreja Santo amaro.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

console.log("=== HEADERS ===");
console.log(data[0]);

console.log("\n=== FIRST 3 DATA ROWS ===");
for (let i = 1; i <= 3; i++) {
  if (data[i]) console.log(data[i]);
}

console.log("\n=== SIDE TABLE / UNIQUE VALUES ===");
const mapping = {};
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row) continue;
  
  // Trying to find the side table columns (like ID | característica de entrada)
  // Usually they are after the main data. Let's print the last few elements of the first 10 rows
  if (i < 10) {
     console.log(`Row ${i} length: ${row.length}, Last 5 items: ${row.slice(Math.max(0, row.length - 5)).join(' | ')}`);
  }
}
