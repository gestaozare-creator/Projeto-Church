const fs = require('fs');
const path = require('path');

// For each dept, we know:
// - slug for the URL
// - deptName for WhatsApp message
const depts = [
  { file: 'louvor/page.tsx', slug: 'louvor', name: 'Louvor' },
  { file: 'midia/page.tsx', slug: 'midia', name: 'Mídia' },
  { file: 'obreiros/page.tsx', slug: 'obreiros', name: 'Obreiros' },
];

const basePath = path.join(__dirname, '..', 'app', 'departamentos');

for (const dept of depts) {
  const file = path.join(basePath, dept.file);
  let content = fs.readFileSync(file, 'utf8');

  // Find the buttons container and the closing tag of the last button
  // We need to find: from the container div that holds buttons, to its closing </div>
  // The pattern is: <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  //   ... multiple buttons ...
  // </div>

  // Find start of button group (from the Link button or Salvar button start)
  const btnGroupStart = content.indexOf('<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>');
  if (btnGroupStart === -1) {
    console.log(`ERROR: Could not find button group in ${dept.file}`);
    continue;
  }

  // Find the closing div of the button group
  // Count depth from btnGroupStart
  let depth = 0;
  let pos = btnGroupStart;
  let btnGroupEnd = -1;
  while (pos < content.length) {
    if (content.startsWith('<div', pos)) depth++;
    else if (content.startsWith('</div>', pos)) {
      depth--;
      if (depth === 0) {
        btnGroupEnd = pos + 6; // include </div>
        break;
      }
    }
    pos++;
  }

  if (btnGroupEnd === -1) {
    console.log(`ERROR: Could not find button group end in ${dept.file}`);
    continue;
  }

  const oldBlock = content.substring(btnGroupStart, btnGroupEnd);

  const newBlock = `<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={async () => {
                await saveToConfig(escalasGlobais);
                alert("✅ Escala salva com sucesso!");
              }}
              style={{
                background: "linear-gradient(135deg, #27ae60, #1e8449)",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
              }}
            >
              💾 Salvar Escala
            </button>
            <button
              onClick={async () => {
                // Resolve churchId
                let resolvedChurchId = currentUser?.churchId;
                if (!resolvedChurchId) {
                  const { data: firstChurch } = await supabase.from('churches').select('id').limit(1).single();
                  resolvedChurchId = firstChurch?.id || '1';
                }
                const url = \`\${window.location.origin}/agenda/\${resolvedChurchId}/${dept.slug}\`;
                const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                const texto = \`📋 *Escala do Ministério de ${dept.name}*\\n🗓️ \${mes}\\n\\n👇 Confira a sua escala:\\n\${url}\`;
                const waUrl = \`https://wa.me/?text=\${encodeURIComponent(texto)}\`;
                window.open(waUrl, '_blank');
              }}
              style={{
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
              }}
            >
              📤 Enviar Escala via WhatsApp
            </button>
          </div>`;

  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✅ Fixed buttons in ${dept.file}`);
}
