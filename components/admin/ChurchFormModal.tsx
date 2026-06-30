"use client";

import { useState, useEffect } from 'react';
import { Church } from '@/types/database';
import { ChurchUsersTab } from './ChurchUsersTab';
import { ChurchControlTab } from './ChurchControlTab';
import { ChurchIdCardTab } from './ChurchIdCardTab';

interface DatabaseUsage {
  members: number;
  transactions: number;
  files: number;
  activeUsers: number;
  totalSizeMB: string;
  infraPlan: string;
  totalCostUSD: string;
}

interface Ministry {
  id: string;
  name: string;
}

interface ChurchFormModalProps {
  initialData: Partial<Church & { activeModules: string[]; userLimit?: number }>;
  ministryGroups: Ministry[];
  getDatabaseUsage: (churchId: string) => DatabaseUsage;
  onClose: () => void;
  onSave: (churchData: any) => Promise<void>;
  editingId: string | null;
}

export function ChurchFormModal({ 
  initialData, 
  ministryGroups, 
  getDatabaseUsage, 
  onClose, 
  onSave, 
  editingId 
}: ChurchFormModalProps) {
  const [formData, setFormData] = useState<any>(initialData);
    const [newDepartment, setNewDepartment] = useState('');
  const [newCulto, setNewCulto] = useState({ name: '', dayOfWeek: 'Domingo', time: '19:30' });

  // Preço por módulo
  const MODULE_PRICES: Record<string, number> = {
    secretaria: 49.90,
    financeiro: 79.90,
    departamentos: 59.90
  };

  const calculateSubscriptionPrice = (activeModules: string[]) => {
    if (activeModules.length === 3) return 149.90;
    return activeModules.reduce((acc, curr) => acc + (MODULE_PRICES[curr] || 0), 0);
  };

  const handleAddCulto = () => {
    if (newCulto.name.trim() && newCulto.time.trim()) {
      const id = `svc_${Date.now()}`;
      setFormData({
        ...formData,
        services: [...(formData.services || []), { ...newCulto, id }]
      });
      setNewCulto({ name: '', dayOfWeek: 'Domingo', time: '19:30' });
    }
  };

  const handleRemoveCulto = (id: string) => {
    setFormData({
      ...formData,
      services: formData.services?.filter((s: any) => s.id !== id)
    });
  };

  const handleAddDepartment = () => {
    if(newDepartment.trim() && !formData.departments?.includes(newDepartment.trim())) {
      setFormData({ ...formData, departments: [...(formData.departments || []), newDepartment.trim()] });
      setNewDepartment('');
    }
  };

  const handleRemoveDepartment = (dep: string) => {
    setFormData({ ...formData, departments: formData.departments?.filter((d: any) => d !== dep) });
  };

  const handleCoverPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => {
        const res = r.result as string;
        setFormData({ ...formData, coverPhotoUrl: res });
      };
      r.readAsDataURL(f);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '16px', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{editingId ? `Gerenciar Igreja: ${formData.name}` : 'Criar Nova Igreja'}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ajuste os dados e relacione a igreja a uma Rede/Ministério</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
          
          {/* Tab Content */}
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            
            <form id="saas-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              
              {/* SESSÃO 1: ESTRUTURA E SEDE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#3498db', borderBottom: '1px solid rgba(52, 152, 219, 0.3)', paddingBottom: '8px' }}>📋 Estrutura & Sede</h4>
<div style={{ background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)', padding: '16px', borderRadius: '12px' }}>
                    <label className="input-label" style={{ color: '#3498db' }}>Rede / Denominação (Ministério)</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select required className="search-input glass-input" style={{ flex: 1 }} value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                          <option value="">Selecione uma Rede...</option>
                          {ministryGroups.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>Todas as sedes e filiais criadas sob esta rede compartilharão relatórios globais da denominação.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 2 }}>
                      <label className="input-label">Nome de Exibição da Igreja</label>
                      <input required type="text" className="search-input glass-input" placeholder="Ex: Filial - Zona Sul" style={{ width: '100%' }} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.isHeadquarters || false} onChange={e => setFormData({...formData, isHeadquarters: e.target.checked})} /> É a Igreja Sede da Rede?
                      </label>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 2 }}>
                      <label className="input-label">Cidade</label>
                      <input required type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label className="input-label">Bairro</label>
                      <input type="text" className="search-input glass-input" style={{ width: '100%' }} placeholder="Ex: Interlagos, Centro..." value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label className="input-label">UF</label>
                      <select className="search-input glass-input" style={{ width: '100%' }} value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})}>
                        <option value="">--</option>
                        <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                        <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                        <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                        <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                        <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                        <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                        <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                        <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                        <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Pastor Responsável (Filial ou Sede)</label>
                    <input required type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.pastorName || ''} onChange={e => setFormData({...formData, pastorName: e.target.value})} />
                  </div>

                  <div>
                    <label className="input-label">Endereço Completo</label>
                    <input type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Telefone / WhatsApp</label>
                      <input type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Status de Acesso Global</label>
                      <select className="search-input glass-input" style={{ width: '100%' }} value={formData.status || 'ativa'} onChange={e => setFormData({...formData, status: e.target.value as 'ativa'|'inativa'})}>
                        <option value="ativa">Ativa (Pode acessar)</option>
                        <option value="inativa">Inativa (Bloqueada)</option>
                      </select>
                    </div>
                  
              </div>
              </div>
              
              {/* SESSÃO 5: DEPARTAMENTOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#95a5a6', borderBottom: '1px solid rgba(149, 165, 166, 0.3)', paddingBottom: '8px' }}>👥 Departamentos</h4>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Adicionar Novo Departamento / Setor Interno</label>
                      <input type="text" className="search-input glass-input" placeholder="Ex: Ministério Infantil, Louvor, Jovens..." style={{ width: '100%' }} value={newDepartment} onChange={e => setNewDepartment(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDepartment())} />
                    </div>
                    <button type="button" onClick={handleAddDepartment} style={{ background: '#e67e22', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <label className="input-label">Departamentos / Grupos Ativos nesta Igreja</label>
                    {formData.departments?.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum departamento cadastrado.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {formData.departments?.map((d: string) => (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                            {d}
                            <button type="button" onClick={() => handleRemoveDepartment(d)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center' }}>&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                  
              </div>
              </div>
              
              {/* SESSÃO 6: AGENDA DE CULTOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#f1c40f', borderBottom: '1px solid rgba(241, 196, 15, 0.3)', paddingBottom: '8px' }}>📅 Agenda de Cultos</h4>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ flex: 2 }}>
                      <label className="input-label">Nome do Culto</label>
                      <input type="text" className="search-input glass-input" placeholder="Ex: Culto da Família" style={{ width: '100%' }} value={newCulto.name} onChange={e => setNewCulto({...newCulto, name: e.target.value})} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label className="input-label">Dia da Semana</label>
                      <select className="search-input glass-input" style={{ width: '100%' }} value={newCulto.dayOfWeek} onChange={e => setNewCulto({...newCulto, dayOfWeek: e.target.value})}>
                        <option value="Domingo">Domingo</option>
                        <option value="Segunda-feira">Segunda-feira</option>
                        <option value="Terça-feira">Terça-feira</option>
                        <option value="Quarta-feira">Quarta-feira</option>
                        <option value="Quinta-feira">Quinta-feira</option>
                        <option value="Sexta-feira">Sexta-feira</option>
                        <option value="Sábado">Sábado</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Horário</label>
                      <input type="time" className="search-input glass-input" style={{ width: '100%', colorScheme: 'dark' }} value={newCulto.time} onChange={e => setNewCulto({...newCulto, time: e.target.value})} />
                    </div>
                    <button type="button" onClick={handleAddCulto} style={{ background: '#f1c40f', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <label className="input-label">Cultos Regulares Cadastrados</label>
                    {(!formData.services || formData.services.length === 0) ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum culto cadastrado na grade fixa.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formData.services?.sort((a: any, b: any) => {
                          const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                          if (days.indexOf(a.dayOfWeek) !== days.indexOf(b.dayOfWeek)) return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
                          return a.time.localeCompare(b.time);
                        }).map((svc: any) => (
                          <div key={svc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#f1c40f' }}>{svc.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{svc.dayOfWeek} às {svc.time}</div>
                            </div>
                            <button type="button" onClick={() => handleRemoveCulto(svc.id)} style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Remover</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </div>
            {/* SESSÃO 3: WHITE LABEL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#9b59b6', borderBottom: '1px solid rgba(155, 89, 182, 0.3)', paddingBottom: '8px' }}>🎨 White Label (App)</h4>

                  <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Cor Primária do App</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="color" style={{ width: '50px', height: '40px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }} value={formData.primaryColor || '#3498db'} onChange={e => setFormData({...formData, primaryColor: e.target.value})} />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formData.primaryColor || '#3498db'}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Cor Secundária (Gradients)</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="color" style={{ width: '50px', height: '40px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }} value={formData.secondaryColor || '#2c3e50'} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formData.secondaryColor || '#2c3e50'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="input-label">Foto de Capa (Header do App)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="search-input glass-input" placeholder="Cole a URL ou faça upload..." style={{ flex: 1 }} value={formData.coverPhotoUrl || ''} onChange={e => setFormData({...formData, coverPhotoUrl: e.target.value})} />
                      <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0 16px', display: 'flex', alignItems: 'center', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        📁 Selecionar Arquivo
                        <input type="file" accept="image/*" onChange={handleCoverPhoto} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {formData.coverPhotoUrl && (
                      <div style={{ height: '100px', borderRadius: '8px', marginTop: '10px', background: `url(${formData.coverPhotoUrl}) center/cover`, border: '1px solid rgba(255,255,255,0.1)', backgroundRepeat: 'no-repeat' }}></div>
                    )}
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: `linear-gradient(135deg, ${formData.primaryColor || '#3498db'}, ${formData.secondaryColor || '#2c3e50'})`, color: '#fff', textAlign: 'center', marginTop: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    <h4 style={{ margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Pré-visualização do App do Cliente</h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Assim ficará o painel para a {formData.name || 'Igreja'}</p>
                  
              </div>
              </div>
              
              {/* SESSÃO 2: LIMITES DO PLANO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#2ecc71', borderBottom: '1px solid rgba(46, 204, 113, 0.3)', paddingBottom: '8px' }}>💳 Limites do Plano</h4>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Plano Contratado</label>
                      <select className="search-input glass-input" style={{ width: '100%', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', fontWeight: 'bold' }} value={formData.plan || 'Basic'} onChange={e => setFormData({...formData, plan: e.target.value as any})}>
                        <option value="Basic">Basic (Até 150 Membros)</option>
                        <option value="Pro">Pro (Até 500 Membros)</option>
                        <option value="Premium">Premium (Ilimitado)</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Status do Pagamento</label>
                      <select className="search-input glass-input" style={{ width: '100%', background: formData.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: formData.subscriptionStatus === 'Inadimplente' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }} value={formData.subscriptionStatus || 'Trial'} onChange={e => setFormData({...formData, subscriptionStatus: e.target.value as any})}>
                        <option value="Trial">Período de Teste (Trial)</option>
                        <option value="Ativa">Pagamento em Dia (Ativa)</option>
                        <option value="Inadimplente">Pagamento Atrasado (Inadimplente)</option>
                        <option value="Cancelada">Assinatura Cancelada</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Trava / Limite de Membros Manuais</label>
                      <input type="number" className="search-input glass-input" style={{ width: '100%' }} placeholder="Deixe em branco para ilimitado" value={formData.memberLimit || ''} onChange={e => setFormData({...formData, memberLimit: e.target.value ? parseInt(e.target.value) : undefined})} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>O sistema bloqueará novos cadastros caso a igreja atinja este limite.</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Trava / Limite de Usuários Admins</label>
                      <input type="number" className="search-input glass-input" style={{ width: '100%' }} placeholder="Deixe em branco para ilimitado (Ex: 3)" value={formData.userLimit || ''} onChange={e => setFormData({...formData, userLimit: e.target.value ? parseInt(e.target.value) : null} as any)} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Bloqueia a criação de novas contas administrativas acima do limite.</span>
                    </div>
                  
              </div>
              </div>
              
              {/* SESSÃO 4: FATURAMENTO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#e67e22', borderBottom: '1px solid rgba(230, 126, 34, 0.3)', paddingBottom: '8px' }}>💰 Faturamento</h4>

                  <div style={{ background: 'rgba(230, 126, 34, 0.05)', border: '1px solid rgba(230, 126, 34, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#e67e22' }}>📦 Precificação Modular (SaaS)</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Selecione quais módulos esta igreja contratou. A mensalidade será recalculada automaticamente.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Módulo Secretaria */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.activeModules?.includes('secretaria')} 
                          onChange={e => {
                            const current = formData.activeModules || [];
                            const next = e.target.checked ? [...current, 'secretaria'] : current.filter((m: string) => m !== 'secretaria');
                            setFormData({ ...formData, activeModules: next });
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>👥 Módulo Secretaria</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Membros, Visitantes, Painel Administrativo e Carteirinhas</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#3498db' }}>R$ 49,90 /mês</span>
                    </label>

                    {/* Módulo Financeiro */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.activeModules?.includes('financeiro')} 
                          onChange={e => {
                            const current = formData.activeModules || [];
                            const next = e.target.checked ? [...current, 'financeiro'] : current.filter((m: string) => m !== 'financeiro');
                            setFormData({ ...formData, activeModules: next });
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>💰 Módulo Financeiro</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fluxo de Caixa, Contas a Pagar/Receber, Relatórios e DRE</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#3498db' }}>R$ 79,90 /mês</span>
                    </label>

                    {/* Módulo Departamentos */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.activeModules?.includes('departamentos')} 
                          onChange={e => {
                            const current = formData.activeModules || [];
                            const next = e.target.checked ? [...current, 'departamentos'] : current.filter((m: string) => m !== 'departamentos');
                            setFormData({ ...formData, activeModules: next });
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>🎵 Módulo Departamentos & Kids</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Check-in Kids (Segurança), Escalas de Louvor, Mídia e Obreiros</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#3498db' }}>R$ 59,90 /mês</span>
                    </label>

                    {/* Valor Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px', marginTop: '10px' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Valor Mensal da Assinatura:</span>
                        {formData.activeModules?.length === 3 && (
                          <span style={{ fontSize: '0.75rem', color: '#2ecc71', display: 'block', fontWeight: 'bold' }}>🎉 Combo Master Aplicado (Economia de R$ 39,80!)</span>
                        )}
                      </div>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2ecc71' }}>
                        R$ {calculateSubscriptionPrice(formData.activeModules || []).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* SUPABASE INFRASTRUCTURE COST ANALYSIS */}
                  <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ Análise de Infraestrutura (Supabase)</h4>
                    
                    {/* Informativo de Regras de Precificação Supabase */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: '6px' }}>📊 Regras de Custos do Supabase:</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li><span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Plano Free (Gratuito):</span> Limite de até <strong>10 usuários ativos</strong> (conexões simultâneas adm) e até <strong>500 MB</strong> de dados totais (armazenamento + banco). Custo: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>$0.00</span>.</li>
                        <li><span style={{ color: '#e67e22', fontWeight: 'bold' }}>Plano Pro:</span> Se ultrapassar 10 usuários ativos OU 500 MB de dados, o plano migra automaticamente para o plano Pro. Custo Base: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>US$ 25.00/mês</span> (inclui 8 GB de banco de dados e 100 GB de storage).</li>
                        <li><span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Custo Excedente Pro:</span> Cada GB adicional que ultrapassar a cota de 8 GB do plano Pro custa <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>US$ 0.50/GB</span>.</li>
                      </ul>
                    </div>

                    {(() => {
                      const usage = getDatabaseUsage(editingId || '1');
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Uso de Dados Estimado</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{usage.totalSizeMB} MB</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                👥 {usage.members} membros | 📁 {usage.files} fotos/arquivos
                              </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Conexões em Tempo Real / Auth</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{usage.activeUsers} usuários</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Cota base Gratuita: máximo 10 ativos
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: usage.infraPlan === 'Gratuito' ? 'rgba(46, 204, 113, 0.08)' : 'rgba(231, 76, 60, 0.08)', border: usage.infraPlan === 'Gratuito' ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(231, 76, 60, 0.2)', borderRadius: '8px', marginTop: '4px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Plano da Infraestrutura: <span style={{ color: usage.infraPlan === 'Gratuito' ? '#2ecc71' : '#e74c3c' }}>{usage.infraPlan}</span></div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                {usage.infraPlan === 'Gratuito' 
                                  ? 'Abaixo dos limites de 500MB de disco e 10 conexões do plano Free.' 
                                  : 'Excedeu a cota gratuita. Requer migração para o plano Pro (US$ 25 base).'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Custo Total Infra</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: usage.infraPlan === 'Gratuito' ? '#2ecc71' : '#e74c3c' }}>
                                ${usage.totalCostUSD} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/mês</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  
              </div>
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

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          <button type="submit" form="saas-form" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)' }}>Salvar Configurações do Tenant</button>
        </div>

      </div>
    </div>
  );
}
