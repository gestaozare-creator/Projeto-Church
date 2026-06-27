"use client";
import { useState, useMemo, useEffect } from 'react';
import { Asset } from '../../../lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useGlobalData } from '@/hooks/useGlobalData';

export default function GestaoPatrimonio() {
  const { currentUser, canSeeAllChurches } = useAuth();
  const { churches } = useGlobalData();
  
  const [church, setChurch] = useState(canSeeAllChurches ? 'ALL' : (currentUser?.churchId || ''));
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [dbAssets, setDbAssets] = useState<Asset[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Carregar dados de Patrimônio do Supabase
  useEffect(() => {
    async function fetchAssets() {
      const { data, error } = await supabase
        .from('assets')
        .select('*');

      if (data) {
        const formatados: Asset[] = data.map(a => ({
          id: a.id,
          churchId: a.church_id || '1',
          name: a.name,
          category: a.category,
          condition: a.condition as any,
          location: a.location,
          purchaseValue: Number(a.purchase_value || 0),
          purchaseDate: a.purchase_date || '',
          expenseId: a.expense_id || undefined
        }));
        setDbAssets(formatados);
      }
    }

    fetchAssets();
  }, []);

  const assets = useMemo(() => {
    return dbAssets.filter(a => {
      const matchChurch = church === 'ALL' || a.churchId === church;
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
      return matchChurch && matchSearch;
    });
  }, [dbAssets, church, search]);

  const handleSaveAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const targetId = editingId || 'ast_' + Date.now().toString();

    const newAsset = {
      id: targetId,
      church_id: currentUser?.churchId || '1',
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      condition: formData.get('condition') as string,
      location: formData.get('location') as string,
      purchase_value: Number(formData.get('purchaseValue')) || 0,
      purchase_date: formData.get('purchaseDate') as string
    };

    const { error } = await supabase.from('assets').upsert(newAsset);
    
    if (error) {
      alert('Erro ao salvar patrimônio: ' + error.message);
      return;
    }

    const savedAsset: Asset = {
      id: newAsset.id,
      churchId: newAsset.church_id,
      name: newAsset.name,
      category: newAsset.category,
      condition: newAsset.condition as any,
      location: newAsset.location,
      purchaseValue: newAsset.purchase_value,
      purchaseDate: newAsset.purchase_date
    };

    if (editingId) {
      setDbAssets(prev => prev.map(a => a.id === editingId ? savedAsset : a));
    } else {
      setDbAssets(prev => [savedAsset, ...prev]);
    }

    setShowAddModal(false);
    setEditingId(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este patrimônio?')) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) {
        alert('Erro ao excluir patrimônio: ' + error.message);
        return;
      }
      setDbAssets(prev => prev.filter(a => a.id !== id));
      setSelectedAsset(null);
    }
  };

  const totalInvested = assets.reduce((acc, curr) => acc + curr.purchaseValue, 0);
  const maintenanceCount = assets.filter(a => a.condition === 'Em Manutenção').length;
  const newCount = assets.filter(a => a.condition === 'Novo').length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getChurchName = (id: string) => churches.find(c => c.id === id)?.name || 'Igreja Desconhecida';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', paddingBottom: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>🪑 Gestão de Patrimônio</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Inventário de Bens e Ativos da Igreja</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canSeeAllChurches ? (
            <select value={church} onChange={e => setChurch(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
              <option value="ALL">Todas as Igrejas</option>
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="search-input glass-input" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.8, pointerEvents: 'none' }}>
              {getChurchName(church)}
            </div>
          )}
          <input 
            type="text" 
            placeholder="Buscar ativo..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input glass-input" 
            style={{ padding: '6px 12px', width: '200px' }}
          />
          <button onClick={() => { setEditingId(null); setShowAddModal(true); }} className="add-button" style={{ padding: '6px 14px', borderRadius: '8px', background: '#3498db', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            + Novo
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Investido</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>{formatCurrency(totalInvested)}</div>
          <div style={{ fontSize: '0.75rem', color: '#3498db', marginTop: '4px' }}>Valor de aquisição dos ativos</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bens Novos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>{newCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#2ecc71', marginTop: '4px' }}>Condição excelente</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Em Manutenção</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>{maintenanceCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#f39c12', marginTop: '4px' }}>Requerem atenção ou conserto</div>
        </div>
      </div>

      {/* LISTA DE ATIVOS */}
      <div className="glass" style={{ flex: 1, padding: '20px', borderRadius: '12px', overflowY: 'auto' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px' }}>Nome do Bem</th>
              <th style={{ padding: '12px 8px' }}>Categoria</th>
              <th style={{ padding: '12px 8px' }}>Localização</th>
              {canSeeAllChurches && <th style={{ padding: '12px 8px' }}>Igreja</th>}
              <th style={{ padding: '12px 8px' }}>Condição</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Valor Aquisição</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => {
              const conditionColors: Record<string, { bg: string, text: string }> = {
                'Novo': { bg: 'rgba(46,204,113,0.15)', text: '#2ecc71' },
                'Bom': { bg: 'rgba(52,152,219,0.15)', text: '#3498db' },
                'Em Manutenção': { bg: 'rgba(243,156,18,0.15)', text: '#f39c12' },
                'Descartado': { bg: 'rgba(231,76,60,0.15)', text: '#e74c3c' },
              };
              const cond = conditionColors[a.condition];

              return (
                <tr 
                  key={a.id} 
                  onClick={() => setSelectedAsset(a)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                  className="hover-row"
                >
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '12px 8px' }}><span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{a.category}</span></td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{a.location}</td>
                  {canSeeAllChurches && <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{getChurchName(a.churchId)}</td>}
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ background: cond.bg, color: cond.text, padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                      {a.condition}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(a.purchaseValue)}</td>
                </tr>
              );
            })}
            {assets.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum ativo encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* MODAL DETALHES & QR CODE */}
      {selectedAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAsset(null)}>
          <div className="glass" style={{ padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '700px', animation: 'fadeIn 0.2s ease', position: 'relative' }} onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setSelectedAsset(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52,152,219,0.15)', color: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                🪑
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Detalhes do Patrimônio</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: #{selectedAsset.id} | Integrado ao Financeiro</div>
              </div>
              <button 
                onClick={() => {
                  setEditingId(selectedAsset.id);
                  setSelectedAsset(null);
                  setShowAddModal(true);
                }} 
                style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Editar
              </button>
              <button 
                onClick={() => handleDeleteAsset(selectedAsset.id)} 
                style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Excluir
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* DADOS DO ATIVO */}
              <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nome do Bem</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedAsset.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoria</div>
                  <div style={{ fontWeight: 600 }}>{selectedAsset.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Condição</div>
                  <div style={{ fontWeight: 600 }}>{selectedAsset.condition}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Localização Atual</div>
                  <div style={{ fontWeight: 600 }}>🏢 {selectedAsset.location} ({getChurchName(selectedAsset.churchId)})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data de Aquisição</div>
                  <div style={{ fontWeight: 600 }}>{selectedAsset.purchaseDate.split('-').reverse().join('/')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Valor Pago</div>
                  <div style={{ fontWeight: 600, color: '#2ecc71' }}>{formatCurrency(selectedAsset.purchaseValue)}</div>
                </div>
              </div>

              {/* QR CODE E ETIQUETA */}
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                  Etiqueta Inteligente
                </div>
                
                {/* QR Code image fetched from public API */}
                <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      typeof window !== 'undefined' ? `${window.location.origin}/qrcode/patrimonio/${selectedAsset.id}` : `https://sistema.igreja.com/qrcode/patrimonio/${selectedAsset.id}`
                    )}`} 
                    alt="QR Code" 
                    width="150" 
                    height="150" 
                  />
                </div>
                
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
                  Cole este QR Code no produto. Ao escanear, qualquer pessoa poderá ver de qual igreja é.
                </div>
                
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '', 'width=400,height=600');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <body style="font-family: sans-serif; display: flex; flex-direction: column; alignItems: center; text-align: center; padding: 20px;">
                            <h2 style="margin-bottom: 5px;">Patrimônio da Igreja</h2>
                            <h4 style="margin-top: 0; color: #555;">${getChurchName(selectedAsset.churchId)}</h4>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/qrcode/patrimonio/' + selectedAsset.id)}" />
                            <p style="font-size: 14px; margin-top: 15px; font-weight: bold;">${selectedAsset.name}</p>
                            <p style="font-size: 12px; color: #777;">ID: ${selectedAsset.id}</p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                      }, 500);
                    }
                  }}
                  style={{ width: '100%', padding: '10px', marginTop: '16px', borderRadius: '8px', background: '#3498db', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  🖨️ Imprimir Etiqueta
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL ADICIONAR/EDITAR PATRIMÔNIO */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, color: '#3498db', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingId ? 'Editar Patrimônio' : 'Novo Patrimônio'}
            </h3>
            <form onSubmit={handleSaveAsset}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome do Bem</label>
                  <input name="name" type="text" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.name : ''} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Categoria</label>
                  <select name="category" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.category : 'Equipamentos'} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Instrumentos">Instrumentos</option>
                    <option value="Estrutura">Estrutura</option>
                    <option value="Móveis">Móveis</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Condição</label>
                  <select name="condition" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.condition : 'Novo'} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <option value="Novo">Novo</option>
                    <option value="Bom">Bom</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Localização</label>
                  <input name="location" type="text" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.location : ''} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Valor Aquisição</label>
                  <input name="purchaseValue" type="number" step="0.01" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.purchaseValue : ''} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Data Aquisição</label>
                  <input name="purchaseDate" type="date" required defaultValue={editingId ? dbAssets.find(a => a.id === editingId)?.purchaseDate : new Date().toISOString().split('T')[0]} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 2, padding: '10px', borderRadius: '8px', background: '#3498db', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Salvar Patrimônio</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
