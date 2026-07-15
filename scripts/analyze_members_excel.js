const xlsx = require('xlsx');
const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Lista Membros Sitio Cercado.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

console.log("Headers:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
console.log("Total Rows:", data.length);
