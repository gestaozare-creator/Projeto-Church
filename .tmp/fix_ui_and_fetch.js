const fs = require('fs');
const path = require('path');

function fixDept(file, deptName) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace saveToConfig
  const oldSaveToConfigRegex = /const saveToConfig = async \(newEscalas: any\) => \{[\s\S]*?\}\;/;
  const newSaveToConfig = `const saveToConfig = async (newEscalas: any) => {
    try {
      await fetch('/api/save-scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId: currentUser?.churchId || '1',
          deptName: '${deptName}',
          newEscalas
        })
      });
    } catch (e) {
      console.error("Failed to save scale via API", e);
    }
  };`;
  content = content.replace(oldSaveToConfigRegex, newSaveToConfig);

  // Add the public link button
  const saveBtnRegex = /<button[\s]*onClick=\{\(\) => \{[\s]*saveToConfig\(escalasGlobais\);[\s]*alert\('Escala salva no sistema com sucesso!'\);[\s]*\}\}[\s\S]*?💾 Salvar Escalas[\s]*<\/button>/;
  
  if (content.match(saveBtnRegex)) {
    const newBtns = `<button 
              onClick={() => {
                const url = window.location.origin + '/agenda/' + (currentUser?.churchId || '1');
                navigator.clipboard.writeText(url);
                alert('Link da agenda pública copiado: ' + url);
              }}
              style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginBottom: '8px' }}
            >
              🔗 Copiar Link Público
            </button>\n            <button 
              onClick={async () => {
                await saveToConfig(escalasGlobais);
                alert('Escala salva no sistema com sucesso!');
              }}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginBottom: '8px' }}
            >
              💾 Salvar Escalas
            </button>`;
    content = content.replace(saveBtnRegex, newBtns);
  }

  fs.writeFileSync(file, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
fixDept(path.join(basePath, 'louvor', 'page.tsx'), 'Louvor');
fixDept(path.join(basePath, 'midia', 'page.tsx'), 'Mídia');
fixDept(path.join(basePath, 'obreiros', 'page.tsx'), 'Obreiros');

console.log('Fixed API and UI buttons.');
