const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Insert the useEffect to handle integration redirect
const hookCode = `
  // Auto-open integrate modal if redirect from visitantes
  useEffect(() => {
    if (typeof window !== 'undefined' && members.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const integrateId = params.get('integrate');
      if (integrateId) {
        const m = members.find(x => x.id === integrateId);
        if (m) {
          setEditForm({ 
            ...m, 
            status: 'ativo', 
            function: m.function && m.function !== 'Visitante' && m.function !== 'Visitante (Kids)' && m.function !== 'Ainda não definida' ? m.function : 'Membro', 
            integrationDate: new Date().toISOString().split('T')[0] 
          });
          setPhotoPreview(m.photoUrl || null);
          setIsCreating(true);
          setIsEditing(true);
          // Limpa a URL
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, [members]);
`;

if (!pageContent.includes('integrateId')) {
  pageContent = pageContent.replace('useEffect(() => {', hookCode + '\n  useEffect(() => {');
  fs.writeFileSync(pagePath, pageContent, 'utf8');
}

const visitantesPath = path.join(__dirname, '..', 'app', 'visitantes', 'page.tsx');
let visContent = fs.readFileSync(visitantesPath, 'utf8');

// Change the button onClick to redirect
visContent = visContent.replace(
  /<button\s+onClick=\{\(\) => \{\s*setConvertForm[\s\S]*?setShowConvertModal\(true\);\s*\}\}\s*style=\{\{\s*flex: 1\.2, padding: '10px'/g,
  `<button 
                    onClick={() => {
                      window.location.href = '/?integrate=' + sel.id;
                    }}
                    style={{ flex: 1.2, padding: '10px'`
);

// Also handle the case where it was the old onClick before update_modal.js
visContent = visContent.replace(
  /<button \s*onClick=\{\(\) => setShowConvertModal\(true\)\}\s*style=\{\{ flex: 1\.2, padding: '10px'/g,
  `<button 
                    onClick={() => {
                      window.location.href = '/?integrate=' + sel.id;
                    }}
                    style={{ flex: 1.2, padding: '10px'`
);

fs.writeFileSync(visitantesPath, visContent, 'utf8');

console.log('Update successful');
