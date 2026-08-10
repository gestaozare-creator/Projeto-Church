"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { BRAZIL_STATES } from '@/lib/brazil-map-data';
import RankingAlmas from '@/components/RankingAlmas';
import InteligenciaFinanceiraDashboard from '@/app/relatorios/InteligenciaFinanceiraDashboard';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Church {
  id: string;
  name: string;
  isHeadquarters?: boolean;
  city?: string;
  state?: string;
  neighborhood?: string;
  pastorName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  coverPhotoUrl?: string;
  status?: string;
  plan?: string;
  subscriptionStatus?: string;
  departments?: string[];
  ministryId?: string;
  services?: { id: string; name: string; dayOfWeek: string; time: string }[];
}

interface Ministry {
  id: string;
  name: string;
  logo_url?: string;
  director_pastor_name?: string;
}

interface MemberStats {
  total: number;
  ativos: number;
  visitantes: number;
}

type TabType = 'overview' | 'mapa' | 'relatorios' | 'ranking';
type ViewMode = 'list' | 'grid' | 'table';

export default function RedePage() {
  const { currentUser, loading, canSeeAllChurches, enterChurch, exitChurch } = useAuth();
  const router = useRouter();

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [memberStats, setMemberStats] = useState<Record<string, MemberStats>>({});
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [pageLoading, setPageLoading] = useState(true);
  const [totalMembros, setTotalMembros] = useState(0);
  const [totalVisitantes, setTotalVisitantes] = useState(0);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [mapHover, setMapHover] = useState<string | null>(null);
  const [mapSelected, setMapSelected] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth());

  // Normaliza nome de estado para sigla UF (suporta banco com nome completo ou sigla)
  const stateNameToUF = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(BRAZIL_STATES).forEach(([uf, data]) => {
      map[uf] = uf; // sigla → sigla
      map[data.name.toLowerCase()] = uf; // nome completo → sigla
    });
    return map;
  }, []);

  const normalizeState = (s: string) => stateNameToUF[s] || stateNameToUF[s?.toLowerCase()] || s?.toUpperCase();

  // Contagem de igrejas por estado (UF) para o mapa da rede
  const mapStateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    churches.forEach(c => {
      if (c.state) {
        const uf = normalizeState(c.state);
        if (uf) counts[uf] = (counts[uf] || 0) + 1;
      }
    });
    return counts;
  }, [churches, stateNameToUF]);

  const mapMaxCount = useMemo(() => Math.max(...Object.values(mapStateCounts), 1), [mapStateCounts]);
  const mapSelectedChurches = useMemo(() =>
    mapSelected ? churches.filter(c => normalizeState(c.state || '') === mapSelected) : [],
    [churches, mapSelected, stateNameToUF]
  );


  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.role !== 'pastor_diretor' && currentUser.role !== 'superadmin' && currentUser.role !== 'pastor_regional') {
        router.push('/dashboard-secretaria');
        return;
      }
      loadData();
    }
  }, [loading, currentUser, selectedMinistryId]);

  const loadData = async () => {
    setPageLoading(true);
    try {
      const { data: ministries } = await supabase.from('ministries').select('*');

      let activeMin: Ministry | null = null;
      if (ministries && ministries.length > 0) {
        setAllMinistries(ministries);
        if (selectedMinistryId) {
          activeMin = ministries.find((m: any) => m.id === selectedMinistryId) || ministries[0];
        } else if (currentUser?.ministryId) {
          activeMin = ministries.find((m: any) => m.id === currentUser.ministryId) || ministries[0];
        } else {
          activeMin = ministries[0];
        }
        setMinistry(activeMin);
      }

      let churchQuery = supabase.from('churches').select('*');
      if (activeMin) {
        churchQuery = churchQuery.eq('ministry_id', activeMin.id);
      }
      let { data: churchesDb } = await churchQuery;
      
      if (churchesDb && currentUser?.role === 'pastor_regional') {
        churchesDb = churchesDb.filter((c: any) => currentUser.regionalChurchIds?.includes(c.id));
      }

      const validChurchIds = churchesDb ? churchesDb.map((c: any) => c.id) : [];

      const { data: servicesDb } = validChurchIds.length > 0 
        ? await supabase.from('church_services').select('*').in('church_id', validChurchIds)
        : { data: [] };

      let allMembersDb: any[] = [];
      if (validChurchIds.length > 0) {
        let pageM = 0;
        while (true) {
          const { data } = await supabase
            .from('members')
            .select('id, status, church_id')
            .in('church_id', validChurchIds)
            .range(pageM * 1000, (pageM + 1) * 1000 - 1);
          if (data && data.length > 0) {
            allMembersDb = allMembersDb.concat(data);
            if (data.length < 1000) break;
            pageM++;
          } else {
            break;
          }
        }
      }

      if (churchesDb) {
        const formatted = churchesDb.map((c: any) => {
          const svcs = (servicesDb || []).filter((s: any) => s.church_id === c.id).map((s: any) => ({
            id: s.id, name: s.name, dayOfWeek: s.day_of_week, time: s.time
          }));
          return {
            id: c.id,
            name: c.name,
            isHeadquarters: c.is_headquarters,
            city: c.city || '',
            state: c.state || '',
            neighborhood: c.neighborhood || '',
            pastorName: c.pastor_name || '',
            logoUrl: c.logo_url || '',
            primaryColor: c.primaryColor || c.primary_color || '#3498db',
            secondaryColor: c.secondaryColor || c.secondary_color || '#2c3e50',
            coverPhotoUrl: c.cover_photo_url || '',
            status: c.status || 'ativa',
            plan: c.plan || 'Basic',
            subscriptionStatus: c.subscription_status || 'Trial',
            departments: c.departments || [],
            ministryId: c.ministry_id || '',
            services: svcs
          };
        });

        // FILTRAGEM ESTRITA POR REDE/MINISTÉRIO ATIVO
        const targetMinId = activeMin?.id || '';
        const filteredChurches = formatted;
        setChurches(filteredChurches);

        // Stats por igreja (apenas da rede ativa)
        const churchIdSet = new Set(filteredChurches.map((c: any) => c.id));
        const networkPeople = allMembersDb.filter((m: any) => churchIdSet.has(m.church_id));

        const stats: Record<string, MemberStats> = {};
        for (const church of filteredChurches) {
          const allPeople = networkPeople.filter((m: any) => m.church_id === church.id);
          const visitors = allPeople.filter((m: any) => m.status === 'pendente' || m.status === 'em_conversao' || m.status === 'visitante');
          const members = allPeople.filter((m: any) => m.status !== 'pendente' && m.status !== 'em_conversao' && m.status !== 'visitante');

          stats[church.id] = {
            total: members.length,
            ativos: members.filter((m: any) => m.status === 'ativo').length,
            visitantes: visitors.length
          };
        }
        setMemberStats(stats);

        const globalVisitors = networkPeople.filter((m: any) => m.status === 'pendente' || m.status === 'em_conversao' || m.status === 'visitante');
        const globalMembers = networkPeople.filter((m: any) => m.status !== 'pendente' && m.status !== 'em_conversao' && m.status !== 'visitante');

        setTotalMembros(globalMembers.length);
        setTotalAtivos(globalMembers.filter((m: any) => m.status === 'ativo').length);
        setTotalVisitantes(globalVisitors.length);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const handleEnterChurch = (church: Church) => {
    // SEGURANÇA: passa o ministryId da igreja para garantir isolamento de rede na sessão inteira
    enterChurch(church.id, church.name, church.ministryId);
    router.push('/dashboard-secretaria');
  };


  if (loading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⛪</div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando painel da rede...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'pastor_diretor' && currentUser.role !== 'superadmin' && currentUser.role !== 'pastor_regional')) {
    return null;
  }

  const tabStyle = (tab: TabType) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
  });

  return (
    <div className="rede-page-container" style={{ minHeight: '100vh' }}>

      {/* CABEÇALHO DA REDE */}
      <div className="glass" style={{
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '28px',
        background: ministry?.logo_url
          ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4))`
          : 'linear-gradient(135deg, rgba(52,152,219,0.15), rgba(155,89,182,0.15))',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        <div className="rede-header-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {ministry?.logo_url ? (
              <img src={ministry.logo_url} alt="Logo da Rede" style={{
                width: '70px', height: '70px', borderRadius: '50%',
                objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }} />
            ) : (
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3498db, #9b59b6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', boxShadow: '0 8px 24px rgba(52,152,219,0.4)'
              }}>⛪</div>
            )}
            <div>
              {allMinistries.length > 1 && currentUser?.role === 'superadmin' && (
                <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 'bold' }}>🏰 SELEÇÃO DE REDE:</span>
                  <select
                    value={ministry?.id || ''}
                    onChange={e => setSelectedMinistryId(e.target.value)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(147, 197, 253, 0.4)', color: '#fff', fontSize: '0.82rem', fontWeight: 600
                    }}
                  >
                    {allMinistries.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#fff' }}>
                        Rede {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Rede {ministry?.name || 'IPCN'}
                </h1>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {ministry?.director_pastor_name ? `Pr. Diretor: ${ministry.director_pastor_name}` : 'Gestão Unificada de Igrejas da Rede'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
            <div className="glass rede-stat-box" style={{ borderRadius: '12px', textAlign: 'center', flex: '1 1 45%', minWidth: '100px', border: '1px solid rgba(52,152,219,0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3498db' }}>{churches.length}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1px' }}>Igrejas</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(52,152,219,0.7)', marginTop: '1px' }}>{churches.filter(c => c.isHeadquarters).length} sede · {churches.filter(c => !c.isHeadquarters).length} filial</div>
            </div>
            <div className="glass rede-stat-box" style={{ borderRadius: '12px', textAlign: 'center', flex: '1 1 45%', minWidth: '100px', border: '1px solid rgba(46,204,113,0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2ecc71' }}>{totalMembros}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1px' }}>Membros</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(46,204,113,0.7)', marginTop: '1px' }}>{totalAtivos} ativos</div>
            </div>
            <div className="glass rede-stat-box" style={{ borderRadius: '12px', textAlign: 'center', flex: '1 1 45%', minWidth: '100px', border: '1px solid rgba(241,196,15,0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1c40f' }}>{totalVisitantes}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1px' }}>Visitantes</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(241,196,15,0.7)', marginTop: '1px' }}>em conversão</div>
            </div>
            <div className="glass rede-stat-box" style={{ borderRadius: '12px', textAlign: 'center', flex: '1 1 45%', minWidth: '100px', border: '1px solid rgba(155,89,182,0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9b59b6' }}>{churches.reduce((acc, c) => acc + (c.services?.length || 0), 0)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1px' }}>Cultos</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(155,89,182,0.7)', marginTop: '1px' }}>na rede toda</div>
            </div>
          </div>

        </div>

        {/* BARRA DE TABS */}
        <div style={{
          display: 'flex', gap: '4px', padding: '12px 24px',
          background: 'var(--bg-glass-dim)', borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>📊 Visão Geral & Igrejas</button>
          <button style={tabStyle('mapa')} onClick={() => setActiveTab('mapa')}>🗺️ Mapa do Brasil</button>
          <button style={tabStyle('relatorios')} onClick={() => setActiveTab('relatorios')}>📋 Relatórios</button>
          <button style={tabStyle('ranking')} onClick={() => setActiveTab('ranking')}>🏆 Ranking de Almas</button>
        </div>
      </div>

      {/* ======================== TAB: VISÃO GERAL ======================== */}
      {activeTab === 'overview' && (
        <div className="rede-overview-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass rede-overview-card" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⛪ Igrejas da Rede
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>— clique para entrar</span>
              </h3>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
                <button onClick={() => setViewMode('list')} style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)'
                }}>📝 Lista</button>
                <button onClick={() => setViewMode('grid')} style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)'
                }}>🗂️ Cards</button>
                <button onClick={() => setViewMode('table')} style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)'
                }}>👥 Membros</button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {churches.map(church => (
                  <div
                    key={church.id}
                    onClick={() => handleEnterChurch(church)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      transition: 'all 0.2s', flexWrap: 'wrap', gap: '12px'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(52,152,219,0.1)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,152,219,0.3)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {church.logoUrl ? (
                        <img src={church.logoUrl} alt={church.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '8px',
                          background: `linear-gradient(135deg, ${church.primaryColor || '#3498db'}, ${church.secondaryColor || '#2c3e50'})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', fontWeight: 'bold', color: '#fff'
                        }}>{church.name.substring(0, 2).toUpperCase()}</div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{church.name}</span>
                          {church.isHeadquarters && (
                            <span style={{ background: '#3498db', color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>SEDE</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          📍 {church.city}{church.state ? ` (${church.state})` : ''} • 🙏 {church.pastorName || 'Pastor não informado'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1c40f' }}>{memberStats[church.id]?.visitantes || 0}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Visitantes</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2ecc71' }}>{memberStats[church.id]?.total || 0}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Membros</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1c40f' }}>{memberStats[church.id]?.ativos || 0}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Ativos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#9b59b6' }}>{church.services?.length || 0}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Cultos</div>
                      </div>
                      <div style={{
                        background: 'rgba(52,152,219,0.15)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)',
                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        🚪 Entrar →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {churches.map(church => (
                  <div key={church.id} className="glass" style={{
                    borderRadius: '16px', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s', cursor: 'pointer'
                  }}>
                    {/* Capa da Igreja */}
                    <div style={{
                      height: '90px',
                      background: church.coverPhotoUrl
                        ? `url(${church.coverPhotoUrl}) center/cover`
                        : `linear-gradient(135deg, ${church.primaryColor || '#3498db'}, ${church.secondaryColor || '#2c3e50'})`,
                      position: 'relative'
                    }}>
                      {church.isHeadquarters && (
                        <span style={{
                          position: 'absolute', top: '10px', left: '10px',
                          background: 'rgba(52,152,219,0.9)', color: '#fff',
                          fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold'
                        }}>SEDE</span>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        {church.logoUrl ? (
                          <img src={church.logoUrl} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} alt="" />
                        ) : (
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: church.primaryColor || '#3498db',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem'
                          }}>{church.name.substring(0, 2).toUpperCase()}</div>
                        )}
                        <div>
                          <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{church.name}</h4>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>📍 {church.city}, {church.state}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: '#fff' }}>Pastor:</strong> {church.pastorName || 'Não informado'}
                        </div>
                        {church.services && church.services.length > 0 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: '#fff' }}>Cultos:</strong> {church.services.map(s => `${s.dayOfWeek} ${s.time}`).join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ flex: 1, background: 'rgba(241,196,15,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1c40f' }}>{memberStats[church.id]?.visitantes || 0}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Visitantes</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(46,204,113,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2ecc71' }}>{memberStats[church.id]?.total || 0}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Membros</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(52,152,219,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3498db' }}>{memberStats[church.id]?.ativos || 0}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Ativos</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(241,196,15,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1c40f' }}>{memberStats[church.id]?.visitantes || 0}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Visitantes</div>
                        </div>
                      </div>

                      {/* Departamentos */}
                      {church.departments && church.departments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                          {church.departments.slice(0, 5).map(d => (
                            <span key={d} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{d}</span>
                          ))}
                          {church.departments.length > 5 && <span style={{ padding: '2px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>+{church.departments.length - 5}</span>}
                        </div>
                      )}

                      <button onClick={() => handleEnterChurch(church)} style={{
                        width: '100%', background: 'rgba(52,152,219,0.15)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)',
                        padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                      }}>🚪 Acessar Secretaria Local</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Igreja', 'Total de Membros', 'Ativos', 'Visitantes', 'Taxa de Atividade'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {churches.map((church, i) => {
                      const stats = memberStats[church.id] || { total: 0, ativos: 0, visitantes: 0 };
                      const taxa = stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0;
                      return (
                        <tr key={church.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '6px',
                                background: `linear-gradient(135deg, ${church.primaryColor || '#3498db'}, ${church.secondaryColor || '#2c3e50'})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold'
                              }}>{church.name.substring(0, 2).toUpperCase()}</div>
                              <div>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{church.name}</div>
                                {church.isHeadquarters && <span style={{ fontSize: '0.6rem', color: '#3498db' }}>SEDE</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{stats.total}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#2ecc71', fontWeight: 700 }}>{stats.ativos}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#f1c40f', fontWeight: 700 }}>{stats.visitantes}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${taxa}%`, height: '100%', background: taxa > 70 ? '#2ecc71' : taxa > 40 ? '#f1c40f' : '#e74c3c', borderRadius: '3px', transition: 'width 0.5s' }} />
                              </div>
                              <span style={{ fontSize: '0.78rem', color: taxa > 70 ? '#2ecc71' : taxa > 40 ? '#f1c40f' : '#e74c3c', fontWeight: 600, minWidth: '35px' }}>{taxa}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Linha de Total */}
                    <tr style={{ background: 'rgba(52,152,219,0.08)', borderTop: '2px solid rgba(52,152,219,0.2)' }}>
                      <td style={{ padding: '12px 14px', color: '#3498db', fontWeight: 800 }}>📊 TOTAL DA REDE</td>
                      <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{totalMembros}</td>
                      <td style={{ padding: '12px 14px', color: '#2ecc71', fontWeight: 800 }}>{totalAtivos}</td>
                      <td style={{ padding: '12px 14px', color: '#f1c40f', fontWeight: 800 }}>{totalVisitantes}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>consolidado</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {activeTab === 'mapa' && (
        <div style={{ display: 'grid', gridTemplateColumns: isRightPanelOpen ? '1fr 280px' : '1fr', gap: '20px', height: 'calc(100vh - 280px)', minHeight: '400px', transition: 'all 0.3s ease' }}>
          {/* MAPA SVG BRASIL */}
          <div className="glass" style={{ borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                  🗺️ Distribuição Geográfica das Igrejas
                </h3>
                <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} style={{
                  background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)',
                  color: '#3498db', padding: '4px 10px', borderRadius: '7px',
                  fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                }}>
                  {isRightPanelOpen ? '⤢ Ampliar Mapa' : '⤡ Mostrar Detalhes'}
                </button>
              </div>

              {mapSelected && (
                <button onClick={() => setMapSelected(null)} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-secondary)', padding: '5px 12px', borderRadius: '7px',
                  fontSize: '0.75rem', cursor: 'pointer'
                }}>✕ Limpar seleção</button>
              )}
            </div>
            <svg viewBox="0 0 500 510" preserveAspectRatio="xMidYMid meet" style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', display: 'block' }}>
              {Object.entries(BRAZIL_STATES).map(([uf, stateData]) => {
                const count = mapStateCounts[uf] || 0;
                const hasChurch = count > 0;
                const intensity = count / mapMaxCount;
                const isHovered = mapHover === uf;
                const isSelected = mapSelected === uf;
                const fill = hasChurch
                  ? `hsla(210, 80%, ${20 + (1 - intensity) * 30}%, ${0.6 + intensity * 0.4})`
                  : 'rgba(255,255,255,0.06)';
                return (
                  <g key={uf}
                    onClick={() => hasChurch && setMapSelected(isSelected ? null : uf)}
                    onMouseEnter={() => setMapHover(uf)}
                    onMouseLeave={() => setMapHover(null)}
                    style={{ cursor: hasChurch ? 'pointer' : 'default' }}
                  >
                    <path
                      d={stateData.path}
                      fill={isSelected ? '#f1c40f' : isHovered && hasChurch ? '#f39c12' : fill}
                      stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"
                      style={{ transition: 'fill 0.2s' }}
                    />
                    {hasChurch && (
                      <>
                        <circle cx={stateData.labelX} cy={stateData.labelY} r="6"
                          fill={isSelected ? '#f1c40f' : '#3498db'} stroke="#fff" strokeWidth="1" />
                        <text x={stateData.labelX} y={stateData.labelY + 1}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize="4.5" fill="#fff" fontWeight="bold"
                        >{count}</text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3498db', border: '2px solid #fff' }} />
                Igreja da rede
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '14px', height: '8px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }} />
                Sem presença
              </div>
            </div>
          </div>

          {/* PAINEL LATERAL DIREITO (Colapsável) */}
          {isRightPanelOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.3s ease', overflowY: 'auto', paddingRight: '4px' }}>

            <div className="glass" style={{ borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Presença Nacional</div>
              {[
                { label: 'Estados com igrejas', value: Object.keys(mapStateCounts).length, color: '#3498db' },
                { label: 'Total de igrejas', value: churches.length, color: '#2ecc71' },
                { label: 'Sedes', value: churches.filter(c => c.isHeadquarters).length, color: '#9b59b6' },
                { label: 'Filiais', value: churches.filter(c => !c.isHeadquarters).length, color: '#f39c12' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {mapSelected ? (
              <div className="glass" style={{ borderRadius: '14px', padding: '16px', border: '1px solid rgba(241, 196, 15, 0.25)', flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f1c40f', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  📍 {BRAZIL_STATES[mapSelected]?.name || mapSelected} — {mapSelectedChurches.length} igreja(s)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mapSelectedChurches.map(church => (
                    <div key={church.id} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {church.logoUrl ? (
                          <img src={church.logoUrl} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: church.primaryColor || '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>⛪</div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{church.name}</div>
                          {church.isHeadquarters && <span style={{ fontSize: '0.62rem', color: '#9b59b6', fontWeight: 600 }}>SEDE</span>}
                        </div>
                      </div>
                      {church.city && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>📍 {church.neighborhood ? `${church.neighborhood}, ` : ''}{church.city}</div>}
                      {church.pastorName && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>🙏 {church.pastorName}</div>}
                      <button onClick={() => handleEnterChurch(church)} style={{
                        marginTop: '8px', width: '100%', padding: '6px', borderRadius: '7px',
                        background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)',
                        color: '#3498db', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                      }}>🚪 Entrar na Igreja</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Ranking por Estado</div>
                {Object.entries(mapStateCounts).sort((a, b) => b[1] - a[1]).map(([uf, count], i) => (
                  <div key={uf} onClick={() => setMapSelected(uf)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', minWidth: '18px' }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.78rem', color: '#fff' }}>{BRAZIL_STATES[uf]?.name || uf}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3498db' }}>{count}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>igreja{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {Object.keys(mapStateCounts).length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', padding: '20px 0' }}>
                    Nenhuma igreja com estado cadastrado
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* ======================== TAB: RELATÓRIOS ======================== */}
      {activeTab === 'relatorios' && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div className="glass" style={{ position: 'sticky', top: '0', zIndex: 11, padding: '12px 20px', borderRadius: '10px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Filtros</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mês:</label>
              <select 
                value={reportMonth} 
                onChange={e => setReportMonth(Number(e.target.value))} 
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ano:</label>
              <select 
                value={reportYear} 
                onChange={e => setReportYear(Number(e.target.value))} 
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                {[...Array(5)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
          
          <InteligenciaFinanceiraDashboard 
            year={reportYear} 
            month={reportMonth} 
            ministryId={ministry?.id}
          />
        </div>
      )}

      {/* ======================== TAB: RANKING ======================== */}
      {activeTab === 'ranking' && (
        <RankingAlmas editable={true} ministryId={ministry?.id} />
      )}
  </div>
  );
}
