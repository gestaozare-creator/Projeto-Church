"use client";

import { useState, useEffect } from 'react';
import { useAuth, User, UserRole } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function UsuariosPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dbChurches, setDbChurches] = useState<any[]>([]);

  useEffect(() => {
    async function loadChurches() {
      const { data } = await supabase.from('churches').select('*');
      if (data) setDbChurches(data);
    }
    loadChurches();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'admin',
    churchId: ''
  });

  const roleBadge: Record<string, { label: string; color: string }> = {
    superadmin: { label: '👑 MASTER', color: '#f1c40f' },
    pastor_diretor: { label: '⛪ DIRETOR', color: '#9b59b6' },
    admin: { label: '🏠 PASTOR LOCAL', color: '#3498db' },
    financeiro: { label: '💰 TESOUREIRO', color: '#2ecc71' },
    secretaria: { label: '📁 SECRETÁRIA', color: '#e67e22' },
    kids_leader: { label: '🧸 LÍDER KIDS', color: '#fd79a8' },
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      role: 'admin',
      churchId: dbChurches[0]?.id || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingId(u.id);
    setFormData({ ...u });
    setShowModal(true);
  };

  const handleDelete = (id: string, role: string) => {
    if (role === 'superadmin') {
      alert('Não é possível excluir o usuário Master.');
      return;
    }
    if(confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate churchId based on role
    const finalData = { ...formData };
    if (finalData.role === 'superadmin' || finalData.role === 'pastor_diretor') {
      finalData.churchId = null;
    } else if (!finalData.churchId && dbChurches.length > 0) {
      finalData.churchId = dbChurches[0].id;
    }

    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...u, ...finalData } as User : u));
    } else {
      setUsers([...users, { ...finalData, id: Date.now().toString() } as User]);
    }
    setShowModal(false);
  };

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '14px', paddingBottom: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>👤 Gestão de Usuários</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gerencie os acessos ao sistema</span>
        </div>
        <button onClick={handleOpenNew} style={{ 
          background: '#3498db', color: '#fff', border: 'none', padding: '8px 16px', 
          borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' 
        }}>
          + Novo Usuário
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{users.length}</span>
        </div>
        <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Admins</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3498db' }}>{users.filter(u => u.role === 'admin').length}</span>
        </div>
        <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Operacional</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e67e22' }}>{users.filter(u => ['secretaria', 'financeiro'].includes(u.role)).length}</span>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.map(u => {
          const badge = roleBadge[u.role];
          const churchName = u.churchId ? dbChurches.find(c => c.id === u.churchId)?.name : 'Acesso Global (Todas)';

          return (
            <div key={u.id} className="glass" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#000' }}>
                {u.name.charAt(0)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '150px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Cargo</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: badge.color }}>{badge.label}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '180px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Igreja/Filial</span>
                <span style={{ fontSize: '0.75rem', color: '#fff' }}>{churchName}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenEdit(u)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Editar</button>
                {u.role !== 'superadmin' && (
                  <button onClick={() => handleDelete(u.id, u.role)} style={{ background: 'rgba(231,76,60,0.15)', border: 'none', color: '#e74c3c', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Excluir</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome Completo</label>
                <input required type="text" className="search-input glass-input" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>E-mail</label>
                <input required type="email" className="search-input glass-input" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Cargo / Permissão</label>
                  <select required className="search-input glass-input" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value="superadmin">👑 Master (Dono)</option>
                    <option value="pastor_diretor">⛪ Pastor Diretor (Global)</option>
                    <option value="admin">🏠 Pastor Local</option>
                    <option value="financeiro">💰 Tesoureiro</option>
                    <option value="secretaria">📁 Secretária</option>
                    <option value="kids_leader">🧸 Líder Kids</option>
                  </select>
                </div>
              </div>

              {/* Só mostra seleção de igreja se não for cargo global */}
              {formData.role !== 'superadmin' && formData.role !== 'pastor_diretor' && (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Igreja de Lotação</label>
                  <select required className="search-input glass-input" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} value={formData.churchId || ''} onChange={e => setFormData({...formData, churchId: e.target.value})}>
                    <option value="" disabled>Selecione uma Igreja...</option>
                    {dbChurches.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Aviso para cargos globais */}
              {(formData.role === 'superadmin' || formData.role === 'pastor_diretor') && (
                <div style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginTop: '4px' }}>
                  ℹ️ Este cargo possui acesso global a todas as igrejas da rede. Não é necessário vinculá-lo a uma igreja específica.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
