const fs = require('fs');
const path = require('path');

function fixButtons(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Rename buttons
  content = content.replaceAll('📸 Salvar Escala (', '🖼️ Gerar Banner (');
  content = content.replaceAll('📸 Salvar Agenda Completa (Mês)', '🖼️ Gerar Banner Completo (Mês)');

  // Explicit Save button
  // In the file, the preview button looks like:
  // <button
  //   onClick={() => setShowPreview("dia")}
  const previewRegex = /<button\s*onClick=\{\(\) => setShowPreview\("dia"\)\}/;
  const explicitSaveBtn = `<button 
              onClick={() => {
                saveToConfig(escalasGlobais);
                alert('Escala salva no sistema com sucesso!');
              }}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginBottom: '8px' }}
            >
              💾 Salvar Escalas
            </button>\n            <button \n              onClick={() => setShowPreview("dia")}`;
            
  if (content.match(previewRegex)) {
      content = content.replace(previewRegex, explicitSaveBtn);
  }

  // Also replace fetch block
  const deptName = file.includes('louvor') ? 'Louvor' : file.includes('midia') ? 'Mídia' : 'Obreiros';
  const fetchBlockStartIdx = content.indexOf('const { data: escalasDb } = await supabase');
  const fetchBlockEndStr = 'setEscalasGlobais(novasEscalas);\n      }';
  const fetchBlockEndIdx = content.indexOf(fetchBlockEndStr);
  if (fetchBlockStartIdx !== -1 && fetchBlockEndIdx !== -1) {
      const fetchBlock = content.substring(fetchBlockStartIdx, fetchBlockEndIdx + fetchBlockEndStr.length);
      const newFetch = `const { data: churchDb } = await supabase.from('churches').select('config').eq('id', currentUser?.churchId || '1').single();
      if (churchDb && churchDb.config && churchDb.config.escalas && churchDb.config.escalas['${deptName}']) {
        setEscalasGlobais(churchDb.config.escalas['${deptName}']);
      } else {
        setEscalasGlobais({});
      }`;
      content = content.replace(fetchBlock, newFetch);
  }

  fs.writeFileSync(file, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
fixButtons(path.join(basePath, 'louvor', 'page.tsx'));
fixButtons(path.join(basePath, 'midia', 'page.tsx'));
fixButtons(path.join(basePath, 'obreiros', 'page.tsx'));

console.log('Fixed buttons and fetch successfully.');
