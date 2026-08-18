"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Church } from '@/types/database';
import { ChurchCard } from '@/components/admin/ChurchCard';
import { ChurchFormModal } from '@/components/admin/ChurchFormModal';
import { MinistryFormModal } from '@/components/admin/MinistryFormModal';
import { useAuth } from '@/context/AuthContext';

export default function IgrejasPage() {
  const { canManageSystem } = useAuth();
  
  const [churches, setChurches] = useState<Church[]>([]);
  const [ministryGroups, setMinistryGroups] = useState<{id: string, name: string}[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [editingMinistryData, setEditingMinistryData] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [liveCounts, setLiveCounts] = useState<Record<string, { members: number; transactions: number; users: number }>>({});
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    async function loadChurches() {
      const { data: churchesDb } = await supabase.from('churches').select('*');
      const { data: servicesDb } = await supabase.from('church_services').select('*');
      const { data: ministriesDb } = await supabase.from('ministries').select('*');
      
      if (ministriesDb) {
        setMinistryGroups(ministriesDb);
      }
      
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
            neighborhood: c.neighborhood || '',
            state: c.state || '',
            address: c.address || '',
            phone: c.phone || '',
            pastorName: c.pastor_name || '',
            logoUrl: c.logo_url || '',
            primaryColor: '#3498db',
            secondaryColor: '#2c3e50',
            status: 'ativa' as 'ativa' | 'inativa',
            plan: c.plan || 'Basic',
            memberLimit: c.member_limit,
            userLimit: 3,
            subscriptionStatus: c.subscription_status || 'Trial',
            departments: c.departments || ['Louvor', 'Obreiros', 'Infantil'],
            coverPhotoUrl: c.cover_photo_url || '',
            activeModules: c.active_modules || ['secretaria', 'financeiro', 'departamentos'],
            cardConfig: c.card_config 
              ? (typeof c.card_config === 'string' ? JSON.parse(c.card_config) : c.card_config)
              : { primaryColor: '#3498db', showLogo: true, showSignature: false, customDisclaimer: 'Este documento é de uso exclusivo do membro.' },
            config: c.config
              ? (typeof c.config === 'string' ? JSON.parse(c.config) : c.config)
              : { receitas: ['Dízimo', 'Oferta', 'Doação'], despesas: ['Aluguel', 'Energia', 'Água'], pagamentos: ['PIX', 'Dinheiro', 'Cartão'], funcoes: ['Membro', 'Obreiro(a)', 'Diácono(a)', 'Presbítero', 'Pastor'] },
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
        const counts: Record<string, { members: number; transactions: number; users: number }> = {};
        
        for (const c of churches) {
          const [{ count: mCount }, { count: tCount }, { count: uCount }] = await Promise.all([
            supabase.from('members').select('*', { count: 'exact', head: true }).eq('church_id', c.id),
            supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('church_id', c.id),
            supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('church_id', c.id)
          ]);
          
          counts[c.id] = { 
            members: mCount || 0, 
            transactions: tCount || 0,
            users: uCount || 0
          };
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

  if (!canManageSystem) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#0d0e15', height: '100vh', color: '#fff' }}>
        <h2 style={{ color: '#e74c3c' }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Apenas o Administrador Master tem permissão para visualizar, editar ou excluir Redes e Igrejas.</p>
      </div>
    );
  }

  const total = churches.length;
  const ativas = churches.filter(c => c.status === 'ativa').length;
  const inadimplentes = churches.filter(c => c.subscriptionStatus === 'Inadimplente').length;

  const handleOpenNew = () => {
    setEditingId(null);
    setInitialData({
      ministryId: ministryGroups[0]?.id || '',
      name: '', isHeadquarters: false, city: '', neighborhood: '', state: 'SP', address: '', phone: '',
      pastorName: '', logoUrl: '', primaryColor: '#3498db', secondaryColor: '#2c3e50',
      status: 'ativa', plan: 'Basic', memberLimit: 150, userLimit: 3, subscriptionStatus: 'Trial',
      departments: ['Louvor', 'Infantil'], coverPhotoUrl: '',
      activeModules: ['secretaria', 'financeiro', 'departamentos'],
      services: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingId(c.id);
    setInitialData({ 
      userLimit: 3,
      ...c,
      activeModules: (c as any).activeModules || ['secretaria', 'financeiro', 'departamentos']
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('churches').delete().eq('id', id);
    if (!error) {
      setChurches(churches.filter(c => c.id !== id));
    } else {
      alert('Erro ao excluir igreja: ' + error.message);
    }
  };

  const handleDeleteMinistry = async (id: string, name: string) => {
    if (window.confirm(`TEM CERTEZA que deseja excluir a rede "${name}"? Esta ação apagará a rede.`)) {
      const { error } = await supabase.from('ministries').delete().eq('id', id);
      if (!error) {
        setMinistryGroups(ministryGroups.filter(m => m.id !== id));
      } else {
        alert('Erro ao excluir rede: ' + error.message);
      }
    }
  };

  const handleTogglePayment = async (m: any) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const newMonth = m.last_paid_month === currentMonth ? null : currentMonth;
    
    const { error } = await supabase.from('ministries').update({ last_paid_month: newMonth }).eq('id', m.id);
    if (!error) {
      setMinistryGroups(ministryGroups.map(x => x.id === m.id ? { ...x, last_paid_month: newMonth } : x));
    } else {
      console.error(error);
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  const handleToggleBlock = async (m: any) => {
    const newBlock = !m.force_blocked;
    const { error } = await supabase.from('ministries').update({ force_blocked: newBlock }).eq('id', m.id);
    if (!error) {
      setMinistryGroups(ministryGroups.map(x => x.id === m.id ? { ...x, force_blocked: newBlock } : x));
    } else {
      alert('Erro ao atualizar bloqueio.');
    }
  };

  const handleSaveChurch = async (churchData: any, isNewMinistry?: boolean, newMinistryName?: string) => {
    let targetId = editingId;
    
    if (!targetId) {
      targetId = Date.now().toString();
    }

    const churchToSave = {
      id: targetId,
      name: churchData.name,
      is_headquarters: churchData.isHeadquarters || false,
      city: churchData.city || '',
      state: churchData.state || 'SP',
      neighborhood: churchData.neighborhood || null,
      address: churchData.address || null,
      phone: churchData.phone || null,
      pastor_name: churchData.pastorName || null,
      ministry_id: churchData.ministryId || null,
      plan: churchData.plan || 'Basic',
      member_limit: churchData.memberLimit || null,
      subscription_status: churchData.subscriptionStatus || 'Trial',
      departments: churchData.departments || [],
      logo_url: churchData.logoUrl || null,
      cover_photo_url: churchData.coverPhotoUrl || null,
      active_modules: churchData.activeModules || [],
      card_config: churchData.cardConfig ? JSON.stringify(churchData.cardConfig) : null,
      config: churchData.config ? JSON.stringify(churchData.config) : null
    };

    const { error: churchError } = await supabase.from('churches').upsert(churchToSave);

    if (churchError) {
      alert('Erro ao salvar igreja: ' + churchError.message);
      return;
    }

    if (editingId) {
      setChurches(churches.map(c => c.id === editingId ? { ...c, ...churchData } : c));
    } else {
      setChurches([...churches, { ...churchData, id: targetId }]);
    }

    if (churchData.services) {
      await supabase.from('church_services').delete().eq('church_id', targetId);
      const toInsert = churchData.services.map((s: any) => ({
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

  const getMinistryName = (id: string) => {
    return ministryGroups.find(m => m.id === id)?.name || 'Desconhecido';
  };

  // Estimativa de banco de dados por igreja baseada nos dados REAIS do Supabase
  const getDatabaseUsage = (churchId: string) => {
    const live = liveCounts[churchId] || { members: 0, transactions: 0, users: 0 };
    const memberCount = live.members;
    const transCount = live.transactions;
    const activeUsersCount = live.users;
    const fileCount = memberCount + (memberCount > 0 ? 10 : 0); // Ex: fotos de membros + fotos de capa

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
            onClick={() => { setEditingMinistryData(null); setShowMinistryModal(true); }}
            style={{ 
              background: '#9b59b6', color: '#fff', border: 'none', padding: '10px 20px', 
              borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(155, 89, 182, 0.3)'
            }}>
            + Nova Rede
          </button>
          
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
            


            {/* Margem do Plano Atual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#fff' }}>
                {globalInfraPlan === 'Gratuito' ? '1. Uso Atual vs Limites do Plano Free (500MB / 10 Conexões)' : '1. Uso Atual vs Limites do Plano Pro (8GB / Conexões Ilimitadas)'}
              </strong>
              
              {/* Barra de Progresso de Memória/Armazenamento */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>💾 Dados do Projeto (Banco + Fotos)</span>
                  <span>{globalStats.totalSizeMB.toFixed(2)} MB / {globalInfraPlan === 'Gratuito' ? '500 MB' : '8.192 MB'}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (globalStats.totalSizeMB / (globalInfraPlan === 'Gratuito' ? 500 : 8192)) * 100)}%`, 
                    height: '100%', 
                    background: (globalStats.totalSizeMB / (globalInfraPlan === 'Gratuito' ? 500 : 8192)) > 0.8 ? '#e74c3c' : '#2ecc71',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  Restam <strong>{Math.max(0, (globalInfraPlan === 'Gratuito' ? 500 : 8192) - globalStats.totalSizeMB).toFixed(2)} MB</strong> de espaço no plano atual.
                </span>
              </div>

              {/* Barra de Progresso de Usuários/Conexões */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>⚡ Conexões de Admins</span>
                  <span>{globalStats.totalActiveUsers} / {globalInfraPlan === 'Gratuito' ? '10 ativos' : 'Ilimitado'}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: globalInfraPlan === 'Gratuito' ? `${Math.min(100, (globalStats.totalActiveUsers / 10) * 100)}%` : '100%', 
                    height: '100%', 
                    background: globalInfraPlan === 'Gratuito' ? ((globalStats.totalActiveUsers / 10) > 0.8 ? '#e74c3c' : '#2ecc71') : '#2ecc71',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  {globalInfraPlan === 'Gratuito' 
                    ? <>Restam <strong>{Math.max(0, 10 - globalStats.totalActiveUsers)} conexões</strong> administrativas antes do upgrade.</>
                    : <>Conexões simultâneas ilimitadas inclusas no plano Pro.</>
                  }
                </span>
              </div>
            </div>

            {/* Projeção para o Próximo Nível (Plano Pro) - Só exibe se estiver no Free */}
            {globalInfraPlan === 'Gratuito' && (
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
            )}

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

      {/* GESTÃO DE PAGAMENTOS E BLOQUEIOS DAS REDES */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Gestão de Redes e Pagamentos
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Logo</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome da Rede</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pr. Diretor</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pagamento (Mês Atual)</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bloqueio Manual</th>
                </tr>
              </thead>
              <tbody>
                {ministryGroups.map((m: any) => {
                  const now = new Date();
                  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                  const isPaidThisMonth = m.last_paid_month === currentMonth;

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px' }}>
                        {m.logo_url ? (
                          <img src={m.logo_url} alt={m.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>⛪</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{m.director_pastor_name || '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleTogglePayment(m)}
                          style={{
                            padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                            background: isPaidThisMonth ? 'rgba(46,204,113,0.2)' : 'rgba(241,196,15,0.2)',
                            color: isPaidThisMonth ? '#2ecc71' : '#f1c40f',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isPaidThisMonth ? '✅ Pago no Mês' : '⏳ Marcar como Pago'}
                        </button>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleBlock(m)}
                          style={{
                            padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                            background: m.force_blocked ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.05)',
                            color: m.force_blocked ? '#e74c3c' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {m.force_blocked ? '🔒 Rede Bloqueada' : '🔓 Bloquear Rede'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AGRUPAMENTO DE IGREJAS POR REDE (MINISTÉRIO) */}
      {ministryGroups.map(ministry => {
        const networkChurches = churches.filter(c => c.ministryId === ministry.id);
        const minData = ministry as any;
        
        return (
          <div key={ministry.id} style={{ marginBottom: '30px' }}>
            <div style={{ padding: '12px 20px', background: 'rgba(155, 89, 182, 0.1)', borderLeft: '4px solid #9b59b6', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {minData.logo_url && (
                  <img src={minData.logo_url} alt="Logo da Rede" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                )}
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>{ministry.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pastor Diretor: {minData.director_pastor_name || 'Não informado'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => { setEditingMinistryData(ministry); setShowMinistryModal(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Editar Rede
                </button>
                <button onClick={() => handleDeleteMinistry(ministry.id, ministry.name)} style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.2)', padding: '6px 12px', borderRadius: '8px', color: '#e74c3c', fontSize: '0.8rem', cursor: 'pointer' }} title="Excluir Rede">
                  🗑️ Excluir
                </button>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', color: '#fff' }}>
                  {networkChurches.length} igrejas
                </span>
              </div>
            </div>

            {networkChurches.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Nenhuma igreja cadastrada nesta rede ainda.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {networkChurches.map(c => (
                  <ChurchCard key={c.id} church={c as any} usage={getDatabaseUsage(c.id)} ministryName={ministry.name} onEdit={handleOpenEdit} onDelete={(c) => handleDelete(c.id)} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {networkChurches.map(c => (
                  <ChurchCard key={c.id} church={c as any} usage={getDatabaseUsage(c.id)} ministryName={ministry.name} onEdit={handleOpenEdit} onDelete={(c) => handleDelete(c.id)} viewMode="list" />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {ministryGroups.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '20px' }}>
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>Nenhuma Rede Cadastrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Para começar, crie sua primeira Rede (Ministério) no botão acima.</p>
          <button onClick={() => setShowMinistryModal(true)} style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>+ Nova Rede</button>
        </div>
      )}

      {/* SUPER MODAL SAAS */}
      {showModal && (
        <ChurchFormModal 
          initialData={initialData}
          ministryGroups={ministryGroups}
          getDatabaseUsage={getDatabaseUsage}
          onClose={() => setShowModal(false)}
          onSave={handleSaveChurch}
          editingId={editingId}
          churches={churches}
        />
      )}

      {showMinistryModal && (
        <MinistryFormModal 
          initialData={editingMinistryData}
          onClose={() => { setShowMinistryModal(false); setEditingMinistryData(null); }}
          onSave={(savedMinistry) => {
            if (editingMinistryData) {
              setMinistryGroups(ministryGroups.map(m => m.id === savedMinistry.id ? savedMinistry : m));
            } else {
              setMinistryGroups([...ministryGroups, savedMinistry]);
            }
            setShowMinistryModal(false);
            setEditingMinistryData(null);
          }}
        />
      )}
      
    </div>
  );
}
