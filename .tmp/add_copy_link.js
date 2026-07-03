const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the button group wrapper
  const targetStr = "<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>";
  const replacement = `<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => {
                const url = window.location.origin + '/agenda/' + (currentUser?.churchId || '1');
                navigator.clipboard.writeText(url);
                alert('Link da agenda pública copiado: ' + url);
              }}
              style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
            >
              🔗 Copiar Link Público
            </button>`;

  content = content.replace(targetStr, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
processFile(path.join(basePath, 'louvor', 'page.tsx'));
processFile(path.join(basePath, 'midia', 'page.tsx'));
processFile(path.join(basePath, 'obreiros', 'page.tsx'));

console.log('Added Copy Link buttons successfully.');
