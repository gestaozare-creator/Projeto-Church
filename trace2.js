const fs = require('fs');
const content = fs.readFileSync('components/admin/ChurchFormModal.tsx', 'utf8');
const lines = content.split('\n');
let divCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Ignore comments that might contain <div
  if (line.includes('//')) continue;
  
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  divCount += opens;
  divCount -= closes;
  
  if (opens > 0 || closes > 0) {
    console.log(`Line ${i + 1}: opens=${opens}, closes=${closes}, total=${divCount}`);
  }
}
console.log(`Final total open divs: ${divCount}`);
