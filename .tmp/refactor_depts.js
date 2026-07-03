const fs = require('fs');
const path = require('path');

function processFile(filePath, deptName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports
  if (!content.includes('toPng')) {
    content = content.replace("import { useAuth } from '@/contexts/AuthContext';", "import { useAuth } from '@/contexts/AuthContext';\nimport { toPng } from 'html-to-image';\nimport download from 'downloadjs';\nimport { useRef } from 'react';");
  }
  
  // Add useRef for banner
  if (!content.includes('bannerRef = useRef')) {
    content = content.replace('const [showPreview, setShowPreview] = useState', 'const bannerRef = useRef<HTMLDivElement>(null);\n  const [showPreview, setShowPreview] = useState');
  }

  // Replace fetch
  const fetchRegex = /const { data: escalasDb } = await supabase\s*\.from\('escalas'\)[\s\S]*?setEscalasGlobais\(novasEscalas\);\n\s*}/;
  const newFetch = `const { data: churchDb } = await supabase.from('churches').select('config').eq('id', currentUser?.churchId || '1').single();
      if (churchDb && churchDb.config && churchDb.config.escalas && churchDb.config.escalas['${deptName}']) {
        setEscalasGlobais(churchDb.config.escalas['${deptName}']);
      } else {
        setEscalasGlobais({});
      }`;
  content = content.replace(fetchRegex, newFetch);

  // Replace saveScale & handleRemove
  const saveRegex = /const saveScale = async \(role: string, memberId: string\) => {[\s\S]*?const handleRemove = async \(role: string, memberId: string\) => {[\s\S]*?Erro ao remover escala do banco:', error\.message\);\n\s*}\n\s*};/;
  
  const newSave = `const saveToConfig = async (newEscalas: any) => {
    const { data: churchDb } = await supabase.from('churches').select('config').eq('id', currentUser?.churchId || '1').single();
    const currentConfig = churchDb?.config || {};
    if (!currentConfig.escalas) currentConfig.escalas = {};
    currentConfig.escalas['${deptName}'] = newEscalas;
    await supabase.from('churches').update({ config: currentConfig }).eq('id', currentUser?.churchId || '1');
  };

  const saveScale = async (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      if (currentAssigned.includes(memberId)) return prev;
      const newState = { ...prev, [activeDate]: { ...dayScale, [role]: [...currentAssigned, memberId] } };
      saveToConfig(newState);
      return newState;
    });
  };

  const handleRemove = async (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      const newState = { ...prev, [activeDate]: { ...dayScale, [role]: currentAssigned.filter(id => id !== memberId) } };
      saveToConfig(newState);
      return newState;
    });
  };`;
  
  content = content.replace(saveRegex, newSave);

  // Replace popup UI
  const popupRegex = /\{\/\* POPUP DE PREVIEW \*\/\}(.|\n)*?(?=\{\/\* FIM POPUP \*\/\})/m;
  const newPopup = `{/* POPUP DE PREVIEW */}\n        {showPreview && (\n          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(8px)' }} onClick={() => setShowPreview(null)}>\n            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '500px', padding: '20px' }} onClick={e => e.stopPropagation()}>\n              \n              {/* BANNER HTML */}\n              <div \n                ref={bannerRef}\n                style={{ \n                  width: '100%', \n                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', \n                  borderRadius: '16px', \n                  padding: '30px', \n                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',\n                  border: '1px solid rgba(255,255,255,0.1)',\n                  position: 'relative',\n                  overflow: 'hidden'\n                }}\n              >\n                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary-color)', opacity: 0.1, borderRadius: '50%', filter: 'blur(40px)' }} />\n                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#fff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Escala de ${deptName}</h2>\n                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>\n                  {showPreview === 'dia' ? activeDate.split('-').reverse().join('/') : selectedMonthStr.split('-').reverse().join('/')}\n                </p>\n\n                {showPreview === 'dia' ? (\n                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>\n                    {Object.entries(escalasGlobais[activeDate] || {}).map(([r, members]) => {\n                       if (members.length === 0) return null;\n                       return (\n                         <div key={r} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid var(--primary-light)' }}>\n                           <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-light)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{r}</h4>\n                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>\n                             {members.map(mId => (\n                               <span key={mId} style={{ color: '#fff', fontSize: '0.9rem' }}>• {dbMembers.find(m => m.id === mId)?.name || mId}</span>\n                             ))}\n                           </div>\n                         </div>\n                       )\n                    })}\n                    {Object.keys(escalasGlobais[activeDate] || {}).length === 0 && <p style={{ textAlign: 'center', color: '#fff' }}>Nenhum escalado.</p>}\n                  </div>\n                ) : (\n                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>\n                    {Object.entries(escalasGlobais).sort(([d1], [d2]) => d1.localeCompare(d2)).map(([d, roles]) => {\n                       if (!d.startsWith(selectedMonthStr)) return null;\n                       if (Object.values(roles).every(m => m.length === 0)) return null;\n                       return (\n                         <div key={d} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid var(--primary-light)' }}>\n                           <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary-light)', fontSize: '0.85rem' }}>DIA {d.split('-').reverse().join('/')}</h4>\n                           {Object.entries(roles).map(([r, members]) => {\n                             if (members.length === 0) return null;\n                             return (\n                               <div key={r} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>\n                                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', width: '60px' }}>{r}:</span>\n                                 <span style={{ color: '#fff', fontSize: '0.85rem' }}>{members.map(mId => dbMembers.find(m => m.id === mId)?.name || mId).join(', ')}</span>\n                               </div>\n                             )\n                           })}\n                         </div>\n                       )\n                    })}\n                  </div>\n                )}\n                <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.5 }}>\n                  <span style={{ fontSize: '0.7rem', color: '#fff' }}>Gerado por Projeto Church</span>\n                </div>\n              </div>\n\n              {/* BOTOES DE AÇÃO */}\n              <div style={{ display: 'flex', gap: '15px', width: '100%' }}>\n                <button \n                  onClick={() => setShowPreview(null)}\n                  style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}\n                >\n                  Fechar\n                </button>\n                <button \n                  onClick={() => {\n                    if (!bannerRef.current) return;\n                    toPng(bannerRef.current, { quality: 1, pixelRatio: 2 })\n                      .then((dataUrl) => download(dataUrl, \`escala-${deptName}-\${showPreview === 'dia' ? activeDate : selectedMonthStr}.png\`))\n                      .catch(err => console.error('Erro ao gerar imagem:', err));\n                  }}\n                  style={{ flex: 2, background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}\n                >\n                  📸 Baixar Criativo (Imagem)\n                </button>\n              </div>\n            </div>\n          </div>\n        )}\n`;
  content = content.replace(popupRegex, newPopup);

  fs.writeFileSync(filePath, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
processFile(path.join(basePath, 'louvor', 'page.tsx'), 'Louvor');
processFile(path.join(basePath, 'midia', 'page.tsx'), 'Mídia');
processFile(path.join(basePath, 'obreiros', 'page.tsx'), 'Obreiros');

console.log('Departments refactored successfully.');
