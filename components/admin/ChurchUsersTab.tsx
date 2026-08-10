"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ChurchUser {
  id: string;
  name: string;
  email: string;
  role: string;
  church_id: string;
  regional_churches?: string[];
}

const ROLES: Record<string, { label: string; color: string }> = {
  pastor_diretor: { label: '👑 Pastor Diretor (Diretor da Rede)',  color: '#9b59b6' },
  pastor_regional: { label: '🗺️ Pastor Regional (Múltiplas Igrejas)', color: '#8e44ad' },
  admin:       { label: '💼 Pastor Local (Acesso Total)',      color: '#3498db' },
  secretaria:  { label: '📄 Secretaria (Sem Financeiro)',       color: '#e67e22' },
  financeiro:  { label: '💰 Tesoureiro (Financeiro)',           color: '#2ecc71' },
  kids_leader: { label: '👶 Líder Kids (Check-in)',             color: '#fd79a8' },
};

type FormMode = 'hidden' | 'create' | 'edit';

export function ChurchUsersTab({ churchId }: { churchId: string }) {
  const [users, setUsers]       = useState<ChurchUser[]>([]);
  const [networkChurches, setNetworkChurches] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [mode, setMode]         = useState<FormMode>('hidden');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const [formName,     setFormName]     = useState('');
  const [formEmail,    setFormEmail]    = useState('');
  const [formRole,     setFormRole]     = useState('admin');
  const [formPassword, setFormPassword] = useState('');
  const [formRegionalChurches, setFormRegionalChurches] = useState<string[]>([]);
  const [showPass,     setShowPass]     = useState(false);

  // Carrega usuários e igrejas da rede (para pastor regional)
  const loadUsersAndChurches = async () => {
    if (!churchId) { setLoading(false); return; }
    setLoading(true);
    
    // Buscar usuários
    const { data: usersData, error: usersErr } = await supabase
      .from('user_roles')
      .select('id, email, role, church_id, name, regional_churches')
      .eq('church_id', churchId);

    if (usersErr) {
      console.error('Erro ao carregar usuários:', usersErr);
    } else {
      setUsers((usersData || []) as ChurchUser[]);
    }

    // Buscar ministryId da igreja atual
    const { data: currentChurch } = await supabase
      .from('churches')
      .select('ministry_id')
      .eq('id', churchId)
      .single();
      
    if (currentChurch?.ministry_id) {
      // Buscar todas as igrejas da mesma rede
      const { data: netChurches } = await supabase
        .from('churches')
        .select('id, name')
        .eq('ministry_id', currentChurch.ministry_id)
        .order('name');
        
      if (netChurches) {
        setNetworkChurches(netChurches);
      }
    }

    setLoading(false);
  };

  useEffect(() => { loadUsersAndChurches(); }, [churchId]);

  const openCreate = () => {
    setFormName(''); setFormEmail(''); setFormRole('admin'); setFormPassword(''); setFormRegionalChurches([]);
    setEditingId(null); setError(null); setSuccess(null); setMode('create');
  };

  const openEdit = (u: ChurchUser) => {
    setFormName(u.name || ''); setFormEmail(u.email);
    setFormRole(u.role); setFormPassword(''); setFormRegionalChurches(u.regional_churches || []);
    setEditingId(u.id); setError(null); setSuccess(null); setMode('edit');
  };

  const closeForm = () => { setMode('hidden'); setError(null); setSuccess(null); };

  // Salvar (criar ou editar) via API do Servidor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);

    try {
      const payload = {
        action: mode,
        email: formEmail,
        password: formPassword,
        name: formName,
        role: formRole,
        churchId,
        regionalChurches: formRole === 'pastor_regional' ? formRegionalChurches : [],
        userId: editingId
      };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Ocorreu um erro ao processar a requisição.');
        setSaving(false);
        return;
      }

      setSuccess(mode === 'create' 
        ? `✅ Usuário "${formName}" criado com sucesso! E-mail já confirmado.` 
        : `✅ Usuário "${formName}" atualizado com sucesso!`
      );
      
      await loadUsersAndChurches();
      setMode('hidden');
    } catch (err: any) {
      setError('Erro inesperado: ' + err.message);
    }
    setSaving(false);
  };

  // Excluir usuário via API do Servidor
  const handleDelete = async (u: ChurchUser) => {
    if (!confirm(`Remover o acesso de "${u.name || u.email}" desta igreja definitivamente?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: u.id
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || 'Erro ao remover usuário.');
        return;
      }

      setSuccess(`Acesso de "${u.name || u.email}" removido.`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err: any) {
      alert('Erro inesperado ao excluir: ' + err.message);
    }
  };

  if (!churchId) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Salve a igreja antes de gerenciar usuários.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: '#fff' }}>Usuários e Permissões</h4>
        {mode === 'hidden' ? (
          <button type="button" onClick={openCreate}
            style={{ background: '#3498db', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            + Novo Usuário
          </button>
        ) : (
          <button type="button" onClick={closeForm}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Cancelar
          </button>
        )}
      </div>

      {/* Feedback */}
      {error   && <div style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#e74c3c', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#2ecc71', fontSize: '0.85rem' }}>{success}</div>}

      {/* Formulário */}
      {mode !== 'hidden' && (
        <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h5 style={{ margin: 0, color: '#3498db' }}>{mode === 'create' ? '➕ Novo Usuário' : '✏️ Editar Usuário'}</h5>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Nome Completo *</label>
              <input required type="text" className="search-input glass-input" style={{ width: '100%' }}
                value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: João da Silva" />
            </div>
            <div>
              <label className="input-label">E-mail *</label>
              <input required type="email" className="search-input glass-input" style={{ width: '100%' }}
                value={formEmail} onChange={e => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={mode === 'edit'}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Nível de Acesso *</label>
              <select className="search-input glass-input" style={{ width: '100%' }}
                value={formRole} onChange={e => setFormRole(e.target.value)}>
                {Object.entries(ROLES).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {formRole === 'pastor_diretor' && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(155,89,182,0.9)' }}>
                  👑 <strong>Pastor Diretor</strong> tem acesso ao <strong>Painel da Rede</strong>, podendo visualizar todas as igrejas da denominação e navegar entre elas para análise completa.
                </div>
              )}
            </div>
            <div>
              <label className="input-label">
                {mode === 'create' ? 'Senha Inicial *' : 'Nova Senha (deixe vazio para manter)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="search-input glass-input"
                  style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder={mode === 'create' ? 'Mín. 6 caracteres' : 'Deixe vazio para não alterar'}
                  required={mode === 'create'}
                  minLength={mode === 'create' ? 6 : undefined}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {formRole === 'pastor_regional' && networkChurches.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Igrejas Gerenciadas *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {networkChurches.map(netC => (
                  <label key={netC.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formRegionalChurches.includes(netC.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormRegionalChurches(prev => [...prev, netC.id]);
                        } else {
                          setFormRegionalChurches(prev => prev.filter(id => id !== netC.id));
                        }
                      }}
                      style={{ accentColor: '#3498db', width: '16px', height: '16px' }}
                    />
                    {netC.name}
                  </label>
                ))}
              </div>
              {formRegionalChurches.length === 0 && (
                <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '8px' }}>
                  Selecione pelo menos uma igreja.
                </div>
              )}
              <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(142,68,173,0.1)', border: '1px solid rgba(142,68,173,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(142,68,173,0.9)' }}>
                  🗺️ <strong>Pastor Regional</strong> tem acesso de gestor completo, mas <strong>apenas</strong> nas igrejas selecionadas acima.
              </div>
            </div>
          )}


          <button type="submit" disabled={saving}
            style={{ background: saving ? 'rgba(46,204,113,0.5)' : '#2ecc71', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.2s' }}>
            {saving ? '⏳ Salvando...' : (mode === 'create' ? '✅ Criar Usuário' : '💾 Salvar Alterações')}
          </button>
        </form>
      )}

      {/* Lista de usuários */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Carregando usuários...</div>}
        {!loading && users.length === 0 && mode === 'hidden' && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
            <div>Nenhum usuário cadastrado para esta igreja.</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Clique em "+ Novo Usuário" para adicionar.</div>
          </div>
        )}
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{u.name || '(sem nome)'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{u.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ROLES[u.role]?.color || '#ccc', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                {ROLES[u.role]?.label || u.role}
              </span>
              <button type="button" onClick={() => openEdit(u)}
                style={{ background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                ✏️ Editar
              </button>
              <button type="button" onClick={() => handleDelete(u)}
                style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
