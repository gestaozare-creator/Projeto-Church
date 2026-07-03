const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'visitantes', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update State
content = content.replace(
  /const \[convertForm, setConvertForm\] = useState\(\{ function: 'Membro', department: 'Geral', integrationDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \}\);/g,
  "const [convertForm, setConvertForm] = useState<any>({ name: '', phone: '', address: '', churchId: '', function: 'Membro', department: 'Geral', integrationDate: new Date().toISOString().split('T')[0], cardValidity: '' });"
);

// 2. Update handleConvertSubmit
content = content.replace(
  /status: 'ativo',\s*function: convertForm\.function \|\| 'Membro',\s*ministry: convertForm\.department \|\| 'Geral',\s*integration_date: convertForm\.integrationDate/g,
  `status: 'ativo',
        name: convertForm.name,
        phone: convertForm.phone,
        address: convertForm.address,
        church_id: convertForm.churchId,
        function: convertForm.function || 'Membro',
        ministry: convertForm.department || 'Geral',
        integration_date: convertForm.integrationDate,
        card_validity: convertForm.cardValidity`
);

// 3. Update onClick pre-fill
content = content.replace(
  /<button \s*onClick=\{\(\) => setShowConvertModal\(true\)\}\s*style=\{\{ flex: 1\.2, padding: '10px'/g,
  `<button 
                    onClick={() => {
                      setConvertForm({
                        name: sel.name || '',
                        phone: sel.phone || '',
                        address: sel.address || '',
                        churchId: sel.churchId || '',
                        function: 'Membro',
                        department: 'Geral',
                        integrationDate: new Date().toISOString().split('T')[0],
                        cardValidity: ''
                      });
                      setShowConvertModal(true);
                    }}
                    style={{ flex: 1.2, padding: '10px'`
);

// 4. Update the Modal JSX
const newModalJSX = `
      {/* CONVERT MODAL */}
      {showConvertModal && sel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleConvertSubmit} className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '440px', margin: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '4px' }}>➕ Novo Membro</h3>
            
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Nome</label>
                <input type="text" value={convertForm.name} onChange={e => setConvertForm((p:any) => ({...p, name: e.target.value}))} className="search-input glass-input" style={{ width:'100%', padding:'8px' }} required />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Função / Habilidade</label>
                  <select value={convertForm.function} onChange={e => setConvertForm((p:any) => ({ ...p, function: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                    <option value="Membro">Membro</option>
                    <option value="Obreiro(a)">Obreiro(a)</option>
                    <option value="Diácono(a)">Diácono(a)</option>
                    <option value="Presbítero">Presbítero</option>
                    <option value="Pastor">Pastor</option>
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Ministério</label>
                  <select value={convertForm.department} onChange={e => setConvertForm((p:any) => ({ ...p, department: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                    {(dbChurches.find(c => c.id === sel.churchId)?.departments || ['Louvor', 'Obreiros', 'Infantil', 'Mídia']).map((d:string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Telefone</label>
                  <input type="text" value={convertForm.phone} onChange={e => setConvertForm((p:any) => ({...p, phone: e.target.value}))} className="search-input glass-input" style={{ width:'100%', padding:'8px' }} required />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Igreja</label>
                  <select value={convertForm.churchId} onChange={e => setConvertForm((p:any) => ({...p, churchId: e.target.value}))} className="search-input glass-input" style={{ width:'100%', padding:'8px' }} required>
                    {dbChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Endereço</label>
                <input type="text" value={convertForm.address} onChange={e => setConvertForm((p:any) => ({...p, address: e.target.value}))} className="search-input glass-input" style={{ width:'100%', padding:'8px' }} />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Data de Batismo / Integração</label>
                  <input type="date" value={convertForm.integrationDate} onChange={e => setConvertForm((p:any) => ({...p, integrationDate: e.target.value}))} className="search-input glass-input" style={{ width:'100%', padding:'8px', colorScheme: 'dark' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.78rem', fontWeight:'bold', display:'block', marginBottom:'3px' }}>Validade da Carteirinha</label>
                  <input type="text" value={convertForm.cardValidity} onChange={e => setConvertForm((p:any) => ({...p, cardValidity: e.target.value}))} placeholder="Ex: 12/2026" className="search-input glass-input" style={{ width:'100%', padding:'8px' }} />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowConvertModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#7f8c8d', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button type="submit" style={{ flex: 1.5, padding: '10px', backgroundColor: '#2ecc71', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cadastrar</button>
            </div>
          </form>
        </div>
      )}
`;

const convertModalRegex = /\{\/\* CONVERT MODAL \*\/\}(.|\n)*?(?=\{\/\* NEW VISITOR MODAL)/g;
content = content.replace(convertModalRegex, newModalJSX + '\n      ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update successful');
