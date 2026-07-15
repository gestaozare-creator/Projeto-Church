const xlsx = require('xlsx');
const wb = xlsx.readFile('E:\\Desktop\\IPCN\\Lista de Membros Santo Amaro.xlsx');
const sheetName = wb.SheetNames[0];
const rawData = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
console.log('Headers:', rawData[0]);
console.log('Row 1:', rawData[1]);
console.log('Row 2:', rawData[2]);
