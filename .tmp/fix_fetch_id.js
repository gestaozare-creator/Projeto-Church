const fs = require('fs');
const path = require('path');

function fixDept(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix fetch block fallback to first church if churchId is '1'
  const oldFetchRegex = /const \{ data: churchDb \} = await supabase\.from\('churches'\)\.select\('config'\)\.eq\('id', currentUser\?\.churchId \|\| '1'\)\.single\(\);/g;
  
  const newFetch = `let targetChurchId = currentUser?.churchId || '1';
      if (targetChurchId === '1') {
        const { data: first } = await supabase.from('churches').select('id').limit(1).single();
        if (first) targetChurchId = first.id;
      }
      const { data: churchDb } = await supabase.from('churches').select('config').eq('id', targetChurchId).single();`;

  content = content.replace(oldFetchRegex, newFetch);

  fs.writeFileSync(file, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
fixDept(path.join(basePath, 'louvor', 'page.tsx'));
fixDept(path.join(basePath, 'midia', 'page.tsx'));
fixDept(path.join(basePath, 'obreiros', 'page.tsx'));

console.log('Fixed fetch IDs.');
