"use client";

import { useState, useEffect } from 'react';
import { MOCK_CHURCHES, Church, MOCK_MINISTRIES, MinistryGroup } from '@/lib/mock-data';
import { supabase } from '@/lib/supabaseClient';


export default function IgrejasPage() {
  const [churches, setChurches] = useState<any[]>([]);
  const [ministryGroups, setMinistryGroups] = useState<MinistryGroup[]>(MOCK_MINISTRIES);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'assinatura' | 'whitelabel' | 'departamentos' | 'faturamento' | 'cultos'>('geral');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [liveCounts, setLiveCounts] = useState<Record<string, { members: number; transactions: number }>>({});
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    async function loadChurches() {
      const { data: churchesDb } = await supabase.from('churches').select('*');
      const { data: servicesDb } = await supabase.from('church_services').select('*');
      
      if (churchesDb) {
        const formatted = churchesDb.map(c => {
          const svcs = (servicesDb || []).filter(s => s.church_id === c.id).map(s => ({
            id: s.id,
            name: s.name,
            dayOfWeek: s.day_of_week,
            time: s.time
          }));
          return {
            id: c.id,
            ministryId: c.ministry_id || 'min1',
            name: c.name,
            isHeadquarters: c.is_headquarters,
            city: c.city || '',
            neighborhood: '',
            state: c.state || '',
            address: '',
            phone: '',
            pastorName: '',
            logoUrl: c.logo_url || '',
            primaryColor: '#3498db',
            secondaryColor: '#2c3e50',
            status: 'ativa',
            plan: c.plan || 'Basic',
            memberLimit: c.member_limit,
            userLimit: 3,
            subscriptionStatus: c.subscription_status || 'Trial',
            departments: c.departments || ['Louvor', 'Infantil'],
            coverPhotoUrl: c.cover_photo_url || '',
            activeModules: ['secretaria', 'financeiro', 'departamentos'],
            services: svcs
          };
        });
        setChurches(formatted);
      }
    }
    loadChurches();
  }, []);

  useEffect(() => {
    async function loadLiveStats() {
      try {
        const { data: membersDb } = await supabase.from('members').select('id, church_id');
        const { data: transDb } = await supabase.from('transactions').select('id, church_id');

        const counts: Record<string, { members: number; transactions: number }> = {};
        
        // Inicializar com zeros
        churches.forEach(c => {
          counts[c.id] = { members: 0, transactions: 0 };
        });

        // Contar membros reais do Supabase
        if (membersDb) {
          membersDb.forEach(m => {
            const cId = m.church_id || '1';
            if (!counts[cId]) counts[cId] = { members: 0, transactions: 0 };
            counts[cId].members += 1;
          });
        }

        // Contar transações reais do Supabase
        if (transDb) {
          transDb.forEach(t => {
            const cId = t.church_id || '1';
            if (!counts[cId]) counts[cId] = { members: 0, transactions: 0 };
            counts[cId].transactions += 1;
          });
        }

        setLiveCounts(counts);
      } catch (err) {
        console.error('Erro ao carregar dados em tempo real:', err);
      } finally {
        setLoadingLive(false);
      }
    }
    loadLiveStats();
  }, [churches]);
  
  const [formData, setFormData] = useState<Partial<Church & { activeModules: string[]; userLimit?: number }>>({
    ministryId: ministryGroups[0]?.id || '',
    name: '',
    isHeadquarters: false,
    city: '',
    neighborhood: '',
    state: 'SP',
    address: '',
    phone: '',
    pastorName: '',
    logoUrl: '',
    primaryColor: '#3498db',
    secondaryColor: '#2c3e50',
    status: 'ativa',
    plan: 'Basic',
    memberLimit: 150,
    userLimit: 3,
    subscriptionStatus: 'Trial',
    departments: ['Louvor', 'Infantil'],
    coverPhotoUrl: '',
    activeModules: ['secretaria', 'financeiro', 'departamentos']
  });

  const [newDepartment, setNewDepartment] = useState('');
  const [newMinistryName, setNewMinistryName] = useState('');
  const [isCreatingMinistry, setIsCreatingMinistry] = useState(false);
  const [newCulto, setNewCulto] = useState({ name: '', dayOfWeek: 'Domingo', time: '19:30' });

  const handleAddCulto = () => {
    if (newCulto.name.trim() && newCulto.time.trim()) {
      const id = `svc_${Date.now()}`;
      setFormData({
        ...formData,
        services: [...(formData.services || []), { ...newCulto, id } as any]
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

  const total = churches.length;
  const ativas = churches.filter(c => c.status === 'ativa').length;
  const inadimplentes = churches.filter(c => c.subscriptionStatus === 'Inadimplente').length;

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      ministryId: ministryGroups[0]?.id || '',
      name: '', isHeadquarters: false, city: '', neighborhood: '', state: 'SP', address: '', phone: '',
      pastorName: '', logoUrl: '', primaryColor: '#3498db', secondaryColor: '#2c3e50',
      status: 'ativa', plan: 'Basic', memberLimit: 150, userLimit: 3, subscriptionStatus: 'Trial',
      departments: ['Louvor', 'Infantil'], coverPhotoUrl: '',
      activeModules: ['secretaria', 'financeiro', 'departamentos'],
      services: []
    });
    setActiveTab('geral');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Church) => {
    setEditingId(c.id);
    setFormData({ 
      userLimit: 3,
      ...c,
      activeModules: (c as any).activeModules || ['secretaria', 'financeiro', 'departamentos']
    });
    setActiveTab('geral');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir esta igreja?')) {
      // Remover do banco
      const { error } = await supabase.from('churches').delete().eq('id', id);
      if (!error) {
        setChurches(churches.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir igreja: ' + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetId = editingId;
    
    if (!targetId) {
      targetId = Date.now().toString();
    }

    const churchData = {
      id: targetId,
      name: formData.name,
      is_headquarters: formData.isHeadquarters || false,
      city: formData.city || '',
      state: formData.state || 'SP',
      ministry_id: formData.ministryId || null,
      plan: formData.plan || 'Basic',
      member_limit: formData.memberLimit || null,
      subscription_status: formData.subscriptionStatus || 'Trial',
      departments: formData.departments || [],
      logo_url: formData.logoUrl || null,
      cover_photo_url: formData.coverPhotoUrl || null
    };

    const { error: churchError } = await supabase.from('churches').upsert(churchData);

    if (churchError) {
      alert('Erro ao salvar igreja: ' + churchError.message);
      return;
    }

    // Atualiza estado local
    if (editingId) {
      setChurches(churches.map(c => c.id === editingId ? { ...c, ...formData } : c));
    } else {
      setChurches([...churches, { ...formData, id: targetId } as any]);
    }

    // Save Services to Supabase
    if (formData.services) {
      // Delete old ones
      await supabase.from('church_services').delete().eq('church_id', targetId);
      // Insert new ones
      const toInsert = formData.services.map((s: any) => ({
        church_id: targetId,
        name: s.name,
        day_of_week: s.dayOfWeek,
        time: s.time
      }));
      if (toInsert.length > 0) {
        await supabase.from('church_services').insert(toInsert);
      }
    }

    setShowModal(false);
  };

  const handleAddDepartment = () => {
    if(newDepartment.trim() && !formData.departments?.includes(newDepartment.trim())) {
      setFormData({ ...formData, departments: [...(formData.departments || []), newDepartment.trim()] });
      setNewDepartment('');
    }
  };

  const handleRemoveDepartment = (dep: string) => {
    setFormData({ ...formData, departments: formData.departments?.filter(d => d !== dep) });
  };

  const handleCreateMinistry = () => {
    if(newMinistryName.trim()) {
      const newMin = { id: `min${Date.now()}`, name: newMinistryName.trim() };
      setMinistryGroups([...ministryGroups, newMin]);
      setFormData({ ...formData, ministryId: newMin.id });
      setNewMinistryName('');
      setIsCreatingMinistry(false);
    }
  };

  const getMinistryName = (id: string) => {
    return ministryGroups.find(m => m.id === id)?.name || 'Desconhecido';
  };

  // Preço por módulo
  const MODULE_PRICES: Record<string, number> = {
    secretaria: 49.90,
    financeiro: 79.90,
    departamentos: 59.90
  };

  const calculateSubscriptionPrice = (activeModules: string[]) => {
    if (activeModules.length === 3) return 149.90; // Preço combo com desconto
    return activeModules.reduce((acc, curr) => acc + (MODULE_PRICES[curr] || 0), 0);
  };

  // Estimativa de banco de dados por igreja baseada nos dados REAIS do Supabase
  const getDatabaseUsage = (churchId: string) => {
    const live = liveCounts[churchId] || { members: 0, transactions: 0 };
    const memberCount = live.members;
    const transCount = live.transactions;
    const fileCount = memberCount + (memberCount > 0 ? 10 : 0); // Ex: fotos de membros + fotos de capa
    
    // Contagem de administradores/usuários configurados no sistema para esta igreja específica
    const activeUsersCount = 1;

    const dbSizeKB = (memberCount * 5) + (transCount * 2); // 5KB por membro, 2KB por transação
    const storageSizeKB = fileCount * 150; // 150KB por arquivo de imagem

    const totalSizeMB = (dbSizeKB + storageSizeKB) / 1024;

    // Regra do Supabase por igreja individual (SaaS Tenant)
    let infraPlan = 'Gratuito';
    let baseCostUSD = 0;
    let extraCostUSD = 0;

    if (totalSizeMB > 500 || activeUsersCount > 10) {
      infraPlan = 'Pro (Supabase)';
      baseCostUSD = 25.00; // Assinatura base do Supabase Pro
      
      const totalSizeGB = totalSizeMB / 1024;
      if (totalSizeGB > 8) {
        extraCostUSD += (totalSizeGB - 8) * 0.50;
      }
    }

    const totalCostUSD = baseCostUSD + extraCostUSD;

    return {
      members: memberCount,
      transactions: transCount,
      files: fileCount,
      activeUsers: activeUsersCount,
      totalSizeMB: totalSizeMB.toFixed(2),
      infraPlan,
      totalCostUSD: totalCostUSD.toFixed(2)
    };
  };

  // Estatísticas globais consolidadas de todas as igrejas para o Painel de Infraestrutura
  const globalStats = churches.reduce((acc, c) => {
    const usage = getDatabaseUsage(c.id);
    acc.totalMembers += usage.members;
    acc.totalTransactions += usage.transactions;
    acc.totalFiles += usage.files;
    acc.totalActiveUsers += usage.activeUsers;
    acc.totalSizeMB += parseFloat(usage.totalSizeMB);
    return acc;
  }, { totalMembers: 0, totalTransactions: 0, totalFiles: 0, totalActiveUsers: 0, totalSizeMB: 0 });

  // Regra de custo global do projeto consolidado no Supabase
  let globalInfraPlan = 'Gratuito';
  let globalBaseCostUSD = 0;
  let globalExtraCostUSD = 0;

  if (globalStats.totalSizeMB > 500 || globalStats.totalActiveUsers > 10) {
    globalInfraPlan = 'Pro (Supabase)';
    globalBaseCostUSD = 25.00;
    const globalSizeGB = globalStats.totalSizeMB / 1024;
    if (globalSizeGB > 8) {
      globalExtraCostUSD += (globalSizeGB - 8) * 0.50;
    }
  }
  const globalTotalCostUSD = globalBaseCostUSD + globalExtraCostUSD;

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '20px', paddingBottom: '30px', overflowY: 'auto', paddingRight: '10px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Painel SaaS Master <span style={{ fontSize: '0.8rem', background: '#e74c3c', padding: '2px 8px', borderRadius: '12px' }}>Dono</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gerenciamento global de Redes/Ministérios e suas Igrejas (Tenants)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botões de alternância da visualização (Cards vs Lista) */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ 
                background: viewMode === 'grid' ? '#3498db' : 'transparent', 
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', 
                fontSize: '0.8rem', cursor: 'pointer', fontWeight: viewMode === 'grid' ? 'bold' : 'normal',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}>
              🎴 Cards
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ 
                background: viewMode === 'list' ? '#3498db' : 'transparent', 
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', 
                fontSize: '0.8rem', cursor: 'pointer', fontWeight: viewMode === 'list' ? 'bold' : 'normal',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}>
              📋 Lista
            </button>
          </div>

          <button 
            onClick={handleOpenNew}
            style={{ 
              background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', 
              borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
            }}>
            + Nova Igreja
          </button>
        </div>
      </div>

      {/* DASHBOARDS SAAS & INFRAESTRUTURA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Métricas do Negócio SaaS */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '150px', borderLeft: '4px solid #9b59b6' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Redes (Ministérios)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '5px' }}>{ministryGroups.length}</div>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '150px', borderLeft: '4px solid #3498db' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Total de Igrejas</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '5px' }}>{total}</div>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '150px', borderLeft: '4px solid #2ecc71' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Igrejas Ativas</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2ecc71', marginTop: '5px' }}>{ativas}</div>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '150px', borderLeft: '4px solid #e74c3c' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Inadimplentes</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e74c3c', marginTop: '5px' }}>{inadimplentes}</div>
          </div>
        </div>

        {/* Consolidação de Infraestrutura Supabase do Projeto Inteiro */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '180px', borderLeft: '4px solid #f1c40f', background: 'rgba(241, 196, 15, 0.03)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>👥 Membros Totais no Banco</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '5px' }}>
              {loadingLive ? 'Carregando...' : globalStats.totalMembers}
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Dados salvos no Supabase em tempo real</span>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '180px', borderLeft: '4px solid #1abc9c', background: 'rgba(26, 188, 156, 0.03)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>💾 Armazenamento Total Usado</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1abc9c', marginTop: '5px' }}>
              {globalStats.totalSizeMB.toFixed(2)} MB
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              ({(globalStats.totalSizeMB / 1024).toFixed(3)} GB) de banco + fotos
            </span>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '180px', borderLeft: '4px solid #e67e22', background: 'rgba(230, 126, 34, 0.03)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>⚡ Admins Ativos no Projeto</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e67e22', marginTop: '5px' }}>
              {globalStats.totalActiveUsers} usuários
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Conexões em tempo real do sistema</span>
          </div>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: '12px', flex: 1, minWidth: '220px', borderLeft: globalInfraPlan === 'Gratuito' ? '4px solid #2ecc71' : '4px solid #e74c3c', background: globalInfraPlan === 'Gratuito' ? 'rgba(46, 204, 113, 0.03)' : 'rgba(231, 76, 60, 0.03)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>💰 Plano & Custo Supabase Global</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: globalInfraPlan === 'Gratuito' ? '#2ecc71' : '#e74c3c', marginTop: '5px' }}>
              {globalInfraPlan} (${globalTotalCostUSD.toFixed(2)}/mês)
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              {globalInfraPlan === 'Gratuito' ? 'Projeto inteiro dentro da cota Free' : 'Necessita plano Pro compartilhado'}
            </span>
          </div>
        </div>

        {/* Projeção e Margem de Recursos (Supabase) */}
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3498db', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Projeção e Margem de Recursos (Supabase)</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Análise de capacidade atual e futura</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Margem do Plano Gratuito Atual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#fff' }}>1. Uso Atual vs Limites do Plano Free (500MB / 10 Conexões)</strong>
              
              {/* Barra de Progresso de Memória/Armazenamento */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>💾 Dados do Projeto (Banco + Fotos)</span>
                  <span>{globalStats.totalSizeMB.toFixed(2)} MB / 500 MB</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (globalStats.totalSizeMB / 500) * 100)}%`, 
                    height: '100%', 
                    background: (globalStats.totalSizeMB / 500) > 0.8 ? '#e74c3c' : '#2ecc71',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  Restam <strong>{Math.max(0, 500 - globalStats.totalSizeMB).toFixed(2)} MB</strong> de espaço gratuito.
                </span>
              </div>

              {/* Barra de Progresso de Usuários/Conexões */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>⚡ Conexões de Admins</span>
                  <span>{globalStats.totalActiveUsers} / 10 ativos</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (globalStats.totalActiveUsers / 10) * 100)}%`, 
                    height: '100%', 
                    background: (globalStats.totalActiveUsers / 10) > 0.8 ? '#e74c3c' : '#2ecc71',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  Restam <strong>{Math.max(0, 10 - globalStats.totalActiveUsers)} conexões</strong> administrativas antes do upgrade.
                </span>
              </div>
            </div>

            {/* Projeção para o Próximo Nível (Plano Pro) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#1abc9c', display: 'flex', alignItems: 'center', gap: '4px' }}>🚀 Projeção Nível Pro (Plano Pro - $25/mês)</strong>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Caso o projeto ultrapasse os limites gratuitos ou necessite de mais segurança de escalabilidade:
              </p>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Banco de Dados:</strong> Expande para <strong style={{ color: '#fff' }}>8 GB</strong> (Você usará apenas {((globalStats.totalSizeMB / 8192) * 100).toFixed(2)}% do plano Pro).</li>
                <li><strong>Storage de Arquivos:</strong> Expande para <strong style={{ color: '#fff' }}>100 GB</strong> dedicados a fotos de membros.</li>
                <li><strong>Conexões Simultâneas:</strong> Ilimitadas (sem trava de 10 conexões).</li>
                <li><strong>Custo Excedente:</strong> Apenas <strong style={{ color: '#e74c3c' }}>US$ 0.50 por GB adicional</strong> de banco ou storage que ultrapassar estes limites inclusos no Pro.</li>
              </ul>
            </div>

            {/* Projeção para o Nível de Excedente Pro (Pay-As-You-Go) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#9b59b6', display: 'flex', alignItems: 'center', gap: '4px' }}>💰 Pro Excedente (Pay-As-You-Go)</strong>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Se você estourar os limites do plano Pro ($25), **não é obrigatório migrar de plano**. Você paga apenas pelo que consumir a mais:
              </p>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Banco de Dados Excedente:</strong> +<strong style={{ color: '#fff' }}>US$ 0.50 / GB</strong> por mês (acima de 8 GB).</li>
                <li><strong>Storage de Arquivos Excedente:</strong> +<strong style={{ color: '#fff' }}>US$ 0.05 / GB</strong> por mês (acima de 100 GB).</li>
                <li><strong>Transferência de Rede (Egress):</strong> +<strong style={{ color: '#fff' }}>US$ 0.09 / GB</strong> (acima de 50 GB de tráfego/mês).</li>
                <li><strong>Usuários Ativos (Auth):</strong> +<strong style={{ color: '#fff' }}>US$ 0.00325 / usuário</strong> (acima de 50.000 MAU).</li>
                <li><span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>*Nota: O plano Team ($599) só é necessário se exigir servidores isolados, SLAs ou SOC2.</span></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* GRID OU LISTA DE IGREJAS */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {churches.map(c => {
            const usage = getDatabaseUsage(c.id);
            return (
              <div key={c.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: `1px solid ${c.status === 'inativa' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`, opacity: c.status === 'inativa' ? 0.6 : 1 }}>
                
                {/* Cabeçalho da Igreja com Capa */}
                <div style={{ height: '85px', background: c.coverPhotoUrl ? `url(${c.coverPhotoUrl}) center/cover` : `linear-gradient(135deg, ${c.primaryColor}, ${c.secondaryColor})`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {c.plan.toUpperCase()}
                    </span>
                    <span style={{ 
                      background: c.subscriptionStatus === 'Ativa' ? 'rgba(46, 204, 113, 0.8)' : c.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.8)' : 'rgba(241, 196, 15, 0.8)', 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 'bold' 
                    }}>
                      {c.subscriptionStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginTop: '-20px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: c.primaryColor, border: '3px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', zIndex: 2 }}>
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', lineHeight: 1.2 }}>{c.name}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: '2px' }}>
                        {getMinistryName(c.ministryId)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: c.isHeadquarters ? '#3498db' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                        {c.isHeadquarters ? '★ SEDE' : 'FILIAL'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        📍 {c.city} - {c.neighborhood || 'Centro'}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }}></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Pastor:</strong> {c.pastorName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Banco de Dados:</strong> {usage.totalSizeMB} MB</div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                    {c.departments?.slice(0, 4).map((d: string) => (
                      <span key={d} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{d}</span>
                    ))}
                    {c.departments && c.departments.length > 4 && <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>+{c.departments.length - 4}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
                  <button onClick={() => handleOpenEdit(c)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(52, 152, 219, 0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>⚙️ Gerenciar Tenant</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {churches.map(c => {
            const usage = getDatabaseUsage(c.id);
            return (
              <div 
                key={c.id} 
                className="glass" 
                style={{ 
                  borderRadius: '12px', 
                  padding: '12px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '15px', 
                  border: `1px solid ${c.status === 'inativa' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)'}`, 
                  opacity: c.status === 'inativa' ? 0.6 : 1,
                  flexWrap: 'wrap'
                }}
              >
                {/* Logo e Nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 auto' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: c.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.name}
                      {c.isHeadquarters && <span style={{ fontSize: '0.65rem', background: '#3498db', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>SEDE</span>}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getMinistryName(c.ministryId)}
                    </span>
                  </div>
                </div>

                {/* Pastor e Localização */}
                <div style={{ minWidth: '150px', flex: '1 1 auto' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Pastor:</strong> {c.pastorName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📍 {c.city} ({c.state})</div>
                </div>

                {/* Dados de Uso e Infra */}
                <div style={{ minWidth: '130px', flex: '1 1 auto' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Banco:</strong> {usage.totalSizeMB} MB</div>
                  <span style={{ fontSize: '0.65rem', background: usage.infraPlan === 'Gratuito' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)', color: usage.infraPlan === 'Gratuito' ? '#2ecc71' : '#e74c3c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', marginTop: '2px' }}>
                    {usage.infraPlan.toUpperCase()} (${usage.totalCostUSD}/mês)
                  </span>
                </div>

                {/* Plano e Status Assinatura */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {c.plan.toUpperCase()}
                  </span>
                  <span style={{ 
                    background: c.subscriptionStatus === 'Ativa' ? 'rgba(46, 204, 113, 0.15)' : c.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)', 
                    color: c.subscriptionStatus === 'Ativa' ? '#2ecc71' : c.subscriptionStatus === 'Inadimplente' ? '#e74c3c' : '#f1c40f',
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' 
                  }}>
                    {c.subscriptionStatus.toUpperCase()}
                  </span>
                </div>

                {/* Ação */}
                <div>
                  <button 
                    onClick={() => handleOpenEdit(c)} 
                    style={{ 
                      background: 'rgba(52, 152, 219, 0.15)', 
                      color: '#3498db', 
                      border: '1px solid rgba(52, 152, 219, 0.2)', 
                      padding: '6px 14px', 
                      borderRadius: '6px', 
                      fontSize: '0.78rem', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }} 
                    onMouseEnter={e => {
                      e.currentTarget.style.background='#3498db';
                      e.currentTarget.style.color='#fff';
                    }} 
                    onMouseLeave={e => {
                      e.currentTarget.style.background='rgba(52, 152, 219, 0.15)';
                      e.currentTarget.style.color='#3498db';
                    }}
                  >
                    ⚙️ Gerenciar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPER MODAL SAAS */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ borderRadius: '16px', width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{editingId ? `Gerenciar Igreja: ${formData.name}` : 'Criar Nova Igreja'}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ajuste os dados e relacione a igreja a uma Rede/Ministério</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Modal Body with Sidebar Tabs */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Tabs Sidebar */}
              <div style={{ width: '220px', background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
                <button type="button" onClick={() => setActiveTab('geral')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'geral' ? 'rgba(52, 152, 219, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'geral' ? '3px solid #3498db' : '3px solid transparent', color: activeTab === 'geral' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>📋 Estrutura & Sede</button>
                <button type="button" onClick={() => setActiveTab('assinatura')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'assinatura' ? 'rgba(46, 204, 113, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'assinatura' ? '3px solid #2ecc71' : '3px solid transparent', color: activeTab === 'assinatura' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>💳 Limites do Plano</button>
                <button type="button" onClick={() => setActiveTab('faturamento')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'faturamento' ? 'rgba(230, 126, 34, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'faturamento' ? '3px solid #e67e22' : '3px solid transparent', color: activeTab === 'faturamento' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>💰 Faturamento Módulos & Infra</button>
                <button type="button" onClick={() => setActiveTab('whitelabel')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'whitelabel' ? 'rgba(155, 89, 182, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'whitelabel' ? '3px solid #9b59b6' : '3px solid transparent', color: activeTab === 'whitelabel' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>🎨 White Label (App)</button>
                <button type="button" onClick={() => setActiveTab('departamentos')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'departamentos' ? 'rgba(149, 165, 166, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'departamentos' ? '3px solid #95a5a6' : '3px solid transparent', color: activeTab === 'departamentos' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>👥 Departamentos Internos</button>
                <button type="button" onClick={() => setActiveTab('cultos')} style={{ textAlign: 'left', padding: '12px 20px', background: activeTab === 'cultos' ? 'rgba(241, 196, 15, 0.2)' : 'transparent', border: 'none', borderRight: activeTab === 'cultos' ? '3px solid #f1c40f' : '3px solid transparent', color: activeTab === 'cultos' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>📅 Agenda de Cultos</button>
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <form id="saas-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {activeTab === 'geral' && (
                    <>
                      <div style={{ background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)', padding: '16px', borderRadius: '12px' }}>
                        <label className="input-label" style={{ color: '#3498db' }}>Rede / Denominação (Ministério)</label>
                        {!isCreatingMinistry ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <select required className="search-input glass-input" style={{ flex: 1 }} value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                              {ministryGroups.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => setIsCreatingMinistry(true)} style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Criar Rede</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" className="search-input glass-input" placeholder="Ex: Ministério Batista da Graça" style={{ flex: 1 }} value={newMinistryName} onChange={e => setNewMinistryName(e.target.value)} autoFocus />
                            <button type="button" onClick={handleCreateMinistry} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
                            <button type="button" onClick={() => setIsCreatingMinistry(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                          </div>
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>Todas as sedes e filiais criadas sob esta rede compartilharão relatórios globais da denominação.</p>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                          <label className="input-label">Nome de Exibição da Igreja</label>
                          <input required type="text" className="search-input glass-input" placeholder="Ex: Filial - Zona Sul" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.isHeadquarters} onChange={e => setFormData({...formData, isHeadquarters: e.target.checked})} /> É a Igreja Sede da Rede?
                          </label>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                          <label className="input-label">Cidade</label>
                          <input required type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label className="input-label">Bairro</label>
                          <input type="text" className="search-input glass-input" style={{ width: '100%' }} placeholder="Ex: Interlagos, Centro..." value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                        <div style={{ width: '80px' }}>
                          <label className="input-label">UF</label>
                          <select className="search-input glass-input" style={{ width: '100%' }} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                            <option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option><option value="RS">RS</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="input-label">Pastor Responsável (Filial ou Sede)</label>
                        <input required type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.pastorName} onChange={e => setFormData({...formData, pastorName: e.target.value})} />
                      </div>

                      <div>
                        <label className="input-label">Endereço Completo</label>
                        <input type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Telefone / WhatsApp</label>
                          <input type="text" className="search-input glass-input" style={{ width: '100%' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Status de Acesso Global</label>
                          <select className="search-input glass-input" style={{ width: '100%' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ativa'|'inativa'})}>
                            <option value="ativa">Ativa (Pode acessar)</option>
                            <option value="inativa">Inativa (Bloqueada)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'assinatura' && (
                    <>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Plano Contratado</label>
                          <select className="search-input glass-input" style={{ width: '100%', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', fontWeight: 'bold' }} value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value as any})}>
                            <option value="Basic">Basic (Até 150 Membros)</option>
                            <option value="Pro">Pro (Até 500 Membros)</option>
                            <option value="Premium">Premium (Ilimitado)</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Status do Pagamento</label>
                          <select className="search-input glass-input" style={{ width: '100%', background: formData.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: formData.subscriptionStatus === 'Inadimplente' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }} value={formData.subscriptionStatus} onChange={e => setFormData({...formData, subscriptionStatus: e.target.value as any})}>
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
                          <input type="number" className="search-input glass-input" style={{ width: '100%' }} placeholder="Deixe em branco para ilimitado" value={formData.memberLimit || ''} onChange={e => setFormData({...formData, memberLimit: e.target.value ? parseInt(e.target.value) : null})} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>O sistema bloqueará novos cadastros caso a igreja atinja este limite.</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Trava / Limite de Usuários Admins</label>
                          <input type="number" className="search-input glass-input" style={{ width: '100%' }} placeholder="Deixe em branco para ilimitado (Ex: 3)" value={(formData as any).userLimit || ''} onChange={e => setFormData({...formData, userLimit: e.target.value ? parseInt(e.target.value) : null} as any)} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Bloqueia a criação de novas contas administrativas acima do limite.</span>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'whitelabel' && (
                    <>
                      <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Cor Primária do App</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input type="color" style={{ width: '50px', height: '40px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }} value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} />
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formData.primaryColor}</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label">Cor Secundária (Gradients)</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input type="color" style={{ width: '50px', height: '40px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }} value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} />
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formData.secondaryColor}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="input-label">URL da Foto de Capa (Header do App)</label>
                        <input type="text" className="search-input glass-input" placeholder="https://..." style={{ width: '100%' }} value={formData.coverPhotoUrl} onChange={e => setFormData({...formData, coverPhotoUrl: e.target.value})} />
                        {formData.coverPhotoUrl && (
                          <div style={{ height: '100px', borderRadius: '8px', marginTop: '10px', background: `url(${formData.coverPhotoUrl}) center/cover`, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                        )}
                      </div>

                      <div style={{ padding: '16px', borderRadius: '12px', background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`, color: '#fff', textAlign: 'center', marginTop: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                        <h4 style={{ margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Pré-visualização do App do Cliente</h4>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Assim ficará o painel para a {formData.name || 'Igreja'}</p>
                      </div>
                    </>
                  )}

                  {activeTab === 'faturamento' && (
                    <>
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
                                const next = e.target.checked ? [...current, 'secretaria'] : current.filter(m => m !== 'secretaria');
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
                                const next = e.target.checked ? [...current, 'financeiro'] : current.filter(m => m !== 'financeiro');
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
                                const next = e.target.checked ? [...current, 'departamentos'] : current.filter(m => m !== 'departamentos');
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
                    </>
                  )}

                  {activeTab === 'departamentos' && (
                    <>
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
                            {formData.departments?.map(d => (
                              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                                {d}
                                <button type="button" onClick={() => handleRemoveDepartment(d)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center' }}>&times;</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === 'cultos' && (
                    <>
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
                    </>
                  )}

                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button type="submit" form="saas-form" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)' }}>Salvar Configurações do Tenant</button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}

