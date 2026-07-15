const xlsx = require('xlsx');
const wb = xlsx.readFile('E:\\Desktop\\IPCN\\Dados financeiro Igreja Sitio Cercado.xlsx');
const sheetName = wb.SheetNames[0];
const rawData = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const excelEpoch = new Date(1899, 11, 30);
  const parsedDate = new Date(excelEpoch.getTime() + serial * 86400000);
  return parsedDate.toISOString().split('T')[0];
}

for(let i=1; i<10; i++) {
   const r = rawData[i];
   console.log(`Row ${i}: Venc=${excelDateToJSDate(r[7])} Pgto=${excelDateToJSDate(r[9])} ID=${r[3]}`);
}
