const fs = require('fs');
const path = require('path');

function processFile(filePath, deptName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix fetch
  const oldFetch = `const { data: escalasDb } = await supabase
        .from("escalas")
        .select("*")
        .eq("department", "${deptName}")
        .gte("date", startDate)
        .lte("date", endDate);`;
  
  if (content.includes('from("escalas")') || content.includes("from('escalas')")) {
    const fetchRegex = /const \{ data: escalasDb \} = await supabase[\s\S]*?setEscalasGlobais\(novasEscalas\);\n\s*\}/m;
    const newFetch = `const { data: churchDb } = await supabase.from('churches').select('config').eq('id', currentUser?.churchId || '1').single();
      if (churchDb && churchDb.config && churchDb.config.escalas && churchDb.config.escalas['${deptName}']) {
        setEscalasGlobais(churchDb.config.escalas['${deptName}']);
      } else {
        setEscalasGlobais({});
      }`;
    content = content.replace(fetchRegex, newFetch);
  }

  // Fix save logic inside handleAssign and handleRemove
  const saveRegex = /const handleAssign = async \(role: string, memberId: string\) => \{[\s\S]*?const handleRemove = async \(role: string, memberId: string\) => \{[\s\S]*?console\.error\("Erro ao remover escala do banco:", error\.message\);\n\s*\}\n\s*\};/m;

  const newSave = `const saveToConfig = async (newEscalas: any) => {
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

  content = content.replace(saveRegex, newSave);

  // Rename buttons
  content = content.replace(/📸 Salvar Escala \(/g, '🖼️ Gerar Banner (');
  content = content.replace(/📸 Salvar Agenda Completa \(Mês\)/g, '🖼️ Gerar Banner Completo (Mês)');

  // Add a direct save button next to the other buttons
  const buttonGroupTarget = /<button[\s\S]*?onClick=\{\(\) => setShowPreview\("dia"\)\}/m;
  const newButton = `<button 
              onClick={() => {
                saveToConfig(escalasGlobais);
                alert('Escala salva no sistema com sucesso!');
              }}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', marginBottom: '8px' }}
            >
              💾 Salvar Escalas
            </button>
            <button 
              onClick={() => setShowPreview("dia")}`;

  content = content.replace(buttonGroupTarget, newButton);

  fs.writeFileSync(filePath, content, 'utf8');
}

const basePath = path.join(__dirname, '..', 'app', 'departamentos');
processFile(path.join(basePath, 'louvor', 'page.tsx'), 'Louvor');
processFile(path.join(basePath, 'midia', 'page.tsx'), 'Mídia');
processFile(path.join(basePath, 'obreiros', 'page.tsx'), 'Obreiros');

console.log('Fixed save and buttons');
