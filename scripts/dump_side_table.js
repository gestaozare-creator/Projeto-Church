const xlsx = require('xlsx');
const wb = xlsx.readFile('E:\\Desktop\\IPCN\\Dados financeiro Igreja Sitio Cercado.xlsx');
const sheetName = wb.SheetNames[0];
const rawData = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
for(let i=1; i<15; i++) {
   console.log(`Row ${i}: ID=${rawData[i][3]} Data=${rawData[i][9]} | Side=${rawData[i][12]} -> ${rawData[i][13]}`);
}
