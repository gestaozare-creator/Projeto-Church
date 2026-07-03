const fs = require('fs');

let content = fs.readFileSync('components/admin/ChurchFormModal.tsx', 'utf8');

// 1. Remove the activeTab state
content = content.replace(/const \[activeTab, setActiveTab\] = useState.*?;\n/, '');

// 2. Remove the sidebar entirely
const sidebarRegex = /\{\/\* Tabs Sidebar \*\/\}\s*<div style=\{\{ width: '220px'[\s\S]*?<\/div>\s*\{\/\* Tab Content \*\/\}/;
content = content.replace(sidebarRegex, '{/* Tab Content */}');

// 3. Remove the top level tab rendering for users, controle, carteirinha
const topTabsRegex = /\{activeTab === 'usuarios' && <ChurchUsersTab churchId=\{editingId \|\| ''\} \/>\}\s*\{activeTab === 'controle' && <ChurchControlTab formData=\{formData\} setFormData=\{setFormData\} \/>\}\s*\{activeTab === 'carteirinha' && <ChurchIdCardTab formData=\{formData\} setFormData=\{setFormData\} \/>\}/;
content = content.replace(topTabsRegex, '');

// 4. Change Modal Body container to be scrollable 
content = content.replace(/<div style=\{\{ display: 'flex', flex: 1, overflow: 'hidden' \}\}>/, `<div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>`);

// 5. Change Tab Content container to be a nice column
content = content.replace(/<div style=\{\{ flex: 1, padding: '24px', overflowY: 'auto' \}\}>/, `<div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>`);

// 6. Restructure 'geral'
content = content.replace(/\{activeTab === 'geral' && \(\s*<>\s*/, `
              {/* SESSÃO 1: ESTRUTURA E SEDE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#3498db', borderBottom: '1px solid rgba(52, 152, 219, 0.3)', paddingBottom: '8px' }}>📋 Estrutura & Sede</h4>
`);

// 7. Restructure 'assinatura'
content = content.replace(/<\/div>\s*<\/>\s*\)\}\s*\{activeTab === 'assinatura' && \(\s*<>/, `
              </div>
              
              {/* SESSÃO 2: LIMITES DO PLANO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#2ecc71', borderBottom: '1px solid rgba(46, 204, 113, 0.3)', paddingBottom: '8px' }}>💳 Limites do Plano</h4>
`);

// 8. Restructure 'whitelabel'
content = content.replace(/<\/div>\s*<\/>\s*\)\}\s*\{activeTab === 'whitelabel' && \(\s*<>/, `
              </div>
              
              {/* SESSÃO 3: WHITE LABEL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#9b59b6', borderBottom: '1px solid rgba(155, 89, 182, 0.3)', paddingBottom: '8px' }}>🎨 White Label (App)</h4>
`);

// 9. Restructure 'faturamento'
content = content.replace(/<\/div>\s*<\/>\s*\)\}\s*\{activeTab === 'faturamento' && \(\s*<>/, `
              </div>
              
              {/* SESSÃO 4: FATURAMENTO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#e67e22', borderBottom: '1px solid rgba(230, 126, 34, 0.3)', paddingBottom: '8px' }}>💰 Faturamento</h4>
`);

// 10. Restructure 'departamentos'
content = content.replace(/<\/div>\s*<\/>\s*\)\}\s*\{activeTab === 'departamentos' && \(\s*<>/, `
              </div>
              
              {/* SESSÃO 5: DEPARTAMENTOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#95a5a6', borderBottom: '1px solid rgba(149, 165, 166, 0.3)', paddingBottom: '8px' }}>👥 Departamentos</h4>
`);

// 11. Restructure 'cultos'
content = content.replace(/<\/div>\s*<\/>\s*\)\}\s*\{activeTab === 'cultos' && \(\s*<>/, `
              </div>
              
              {/* SESSÃO 6: AGENDA DE CULTOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#f1c40f', borderBottom: '1px solid rgba(241, 196, 15, 0.3)', paddingBottom: '8px' }}>📅 Agenda de Cultos</h4>
`);

// 12. End of form and insert Advanced Sections
const endFormRegex = /<\/div>\s*<\/>\s*\)\}\s*<\/form>\s*<\/div>/;
content = content.replace(endFormRegex, `
              </div>
            </form>

            {/* SEÇÕES AVANÇADAS (Só aparecem se a igreja já estiver salva) */}
            {editingId ? (
              <>
                {/* SESSÃO 7: USUÁRIOS E ACESSOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(52, 152, 219, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.1)' }}>
                  <h4 style={{ margin: 0, color: '#3498db', borderBottom: '1px solid rgba(52, 152, 219, 0.3)', paddingBottom: '12px', fontSize: '1.1rem' }}>👥 Usuários e Acessos</h4>
                  <ChurchUsersTab churchId={editingId} />
                </div>

                {/* SESSÃO 8: CONTROLE E CATEGORIAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(155, 89, 182, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(155, 89, 182, 0.1)' }}>
                  <h4 style={{ margin: 0, color: '#9b59b6', borderBottom: '1px solid rgba(155, 89, 182, 0.3)', paddingBottom: '12px', fontSize: '1.1rem' }}>🔧 Categorias e Controle</h4>
                  <ChurchControlTab formData={formData} setFormData={setFormData} />
                </div>

                {/* SESSÃO 9: CARTEIRINHA DE MEMBRO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(230, 126, 34, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(230, 126, 34, 0.1)' }}>
                  <h4 style={{ margin: 0, color: '#e67e22', borderBottom: '1px solid rgba(230, 126, 34, 0.3)', paddingBottom: '12px', fontSize: '1.1rem' }}>🪪 Carteirinha de Membro</h4>
                  <ChurchIdCardTab formData={formData} setFormData={setFormData} />
                </div>
              </>
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '12px', border: '1px dashed rgba(46, 204, 113, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <h4 style={{ margin: 0, color: '#2ecc71' }}>Opções Avançadas Bloqueadas</h4>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', maxWidth: '400px' }}>
                  As seções de <strong>Usuários, Controle e Carteirinha</strong> ficarão disponíveis automaticamente assim que você salvar os dados básicos acima e a igreja for criada no banco.
                </p>
              </div>
            )}
          </div>
`);

fs.writeFileSync('components/admin/ChurchFormModal.tsx', content);
console.log('Refactor complete!');
