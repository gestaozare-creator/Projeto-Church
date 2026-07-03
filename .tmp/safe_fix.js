const fs = require('fs');
const path = require('path');

function fixDept(file, deptName) {
  let content = fs.readFileSync(file, 'utf8');
  
  const assignStartIdx = content.indexOf('const handleAssign = async (role: string, memberId: string) => {');
  const removeErrStr = 'console.error("Erro ao remover escala do banco:", error.message);\n    }\n  };';
  let removeErrIdx = content.indexOf(removeErrStr);
  if (removeErrIdx === -1) {
    console.log("Could not find removeErrStr in " + file);
    return;
  }
  let blockEndIdx = removeErrIdx + removeErrStr.length;
  
  const blockToReplace = content.substring(assignStartIdx, blockEndIdx);
  
  const newBlock = `const saveToConfig = async (newEscalas: any) => {
    const { data: churchDb } = await supabase.from('churches').select('config').eq('id', currentUser?.churchId || '1').single();
    const currentConfig = churchDb?.config || {};
    if (!currentConfig.escalas) currentConfig.escalas = {};
    currentConfig.escalas['${deptName}'] = newEscalas;
    await supabase.from('churches').update({ config: currentConfig }).eq('id', currentUser?.churchId || '1');
  };

  const handleAssign = async (role: string, memberId: string) => {
    setEscalasGlobais((prev) => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      if (currentAssigned.includes(memberId)) return prev;
      const newState = {
        ...prev,
        [activeDate]: { ...dayScale, [role]: [...currentAssigned, memberId] },
      };
      saveToConfig(newState);
      return newState;
    });
  };

  const handleRemove = async (role: string, memberId: string) => {
    setEscalasGlobais((prev) => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      const newState = {
        ...prev,
        [activeDate]: {
          ...dayScale,
          [role]: currentAssigned.filter((id) => id !== memberId),
        },
      };
      saveToConfig(newState);
      return newState;
    });
  };`;
  
  content = content.replace(blockToReplace, newBlock);
  
  // Fetch block
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

  // Rename buttons
  content = content.replace(/📸 Salvar Escala \(/g, '🖼️ Gerar Banner (');
  content = content.replace(/📸 Salvar Agenda Completa \(Mês\)/g, '🖼️ Gerar Banner Completo (Mês)');

  // Explicit Save button
  // In the file, the preview button looks like:
  // <button
  //   onClick={() => setShowPreview("dia")}
  // We need to inject our button right before it
  const previewRegex = /<button\s*onClick=\{\(\) => setShowPreview\("dia"\)\}/;
  const explicitSaveBtn = `<button 
              onClick={() => {
                saveToConfig(escalasGlobais);
                alert('Escala salva no sistema com sucesso!');
              }}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
            >
              💾 Salvar Escalas
            </button>\n            <button onClick={() => setShowPreview("dia")}`;
            
  content = content.replace(previewRegex, explicitSaveBtn);

  fs.writeFileSync(file, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
fixDept(path.join(basePath, 'louvor', 'page.tsx'), 'Louvor');
fixDept(path.join(basePath, 'midia', 'page.tsx'), 'Mídia');
fixDept(path.join(basePath, 'obreiros', 'page.tsx'), 'Obreiros');

console.log('Fixed exactly as intended.');
