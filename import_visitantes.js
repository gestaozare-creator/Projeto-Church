const fs = require('fs');
const xlsx = require('xlsx');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: churches, error: cErr } = await supabase.from('churches').select('id, name');
  if (cErr) {
    console.error('Error fetching churches:', cErr);
    return;
  }
  const guadalupe = churches.find(c => c.name.toLowerCase().includes('sitio cercado') || c.name.toLowerCase().includes('sítio cercado'));
  if (!guadalupe) {
    console.error('Church Sitio Cercado not found! Churches available:', churches.map(c => c.name));
    return;
  }
  
  console.log(`Found Sitio Cercado with ID: ${guadalupe.id}`);
  
  const workbook = xlsx.readFile('E:\\Desktop\\IPCN\\Lista de visitantes IPCN Sitio Cercado.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, header: 1 });
  
  // Skip header if first row is header
  const rows = data.slice(1);
  let toInsert = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2 || !row[1]) continue;
    
    // Parse date (e.g. 04/07/2022 21:39:48)
    let rawDate = row[0];
    let isoDate = new Date().toISOString().split('T')[0];
    if (rawDate) {
      // Excel might give date as number or string. Handle both.
      let dateStr = String(rawDate).trim();
      let parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        let year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        let p1 = parseInt(parts[1], 10);
        let p0 = parseInt(parts[0], 10);
        let monthStr, dayStr;
        if (p1 > 12) {
          // It's MM/DD/YYYY
          monthStr = parts[0].padStart(2, '0');
          dayStr = parts[1].padStart(2, '0');
        } else {
          // It's DD/MM/YYYY
          monthStr = parts[1].padStart(2, '0');
          dayStr = parts[0].padStart(2, '0');
        }
        isoDate = `${year}-${monthStr}-${dayStr}`;
      } else if (!isNaN(rawDate)) {
        // Excel serial date format
        const excelEpoch = new Date(1899, 11, 30);
        const parsedDate = new Date(excelEpoch.getTime() + rawDate * 86400000);
        if (!isNaN(parsedDate)) {
          isoDate = parsedDate.toISOString().split('T')[0];
        }
      }
    }
    
    const statusMap = {
      'Visitante': 'visitante',
      'Em conversão': 'em_conversao',
      'Membro': 'membro'
    };
    let st = row[8] ? statusMap[row[8].trim()] || 'pendente' : 'pendente';
    
    toInsert.push({
      id: crypto.randomUUID(),
      church_id: guadalupe.id,
      integration_date: isoDate,
      name: row[1] || 'Sem Nome',
      phone: String(row[2] || ''),
      state: String(row[7] || 'Geral'),
      ministry: String(row[4] || 'Outros'),
      address: String(row[7] || ''),
      status: st === 'membro' ? 'ativo' : st === 'em_conversao' ? 'em_conversao' : 'pendente',
      function: 'Visitante'
    });
  }
  
  console.log(`Inserting ${toInsert.length} visitors...`);
  
  // Insert in batches of 100
  let successCount = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await supabase.from('members').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      successCount += batch.length;
    }
  }
  
  console.log(`Import finished! Successfully imported ${successCount} visitors.`);
}

run();
