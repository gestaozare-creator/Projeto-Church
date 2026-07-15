const xlsx = require('xlsx');
const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Dados Financeiro Igreja Santo amaro.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
const types = new Set();
for (let i = 1; i < data.length; i++) {
  if (data[i]) types.add(data[i][1]);
}
console.log("Unique Types:", Array.from(types));
