const fs = require('fs');
const content = fs.readFileSync('components/admin/ChurchFormModal.tsx', 'utf8');

const lines = content.split('\n');
let divCount = 0;
let formStarted = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<form')) formStarted = true;
  
  if (formStarted) {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    divCount += opens;
    divCount -= closes;
    console.log(`Line ${i + 1}: opens=${opens}, closes=${closes}, total=${divCount}`);
  }
  
  if (line.includes('</form>')) {
    console.log(`End of form. Total open divs: ${divCount}`);
    break;
  }
}
