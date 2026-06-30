"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Church } from '@/types/database';

type VisitorStatus = 'visitante' | 'em_conversao' | 'membro';

interface Visitor {
  id: string;
  churchId: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  source: string;
  wantsVisit: boolean;
  status: VisitorStatus;
  address: string;
  notes: string;
  culto?: string;
  horario?: string;
}

export default function Visitantes() {
  const { currentUser, canSeeAllChurches } = useAuth();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [dbChurches, setDbChurches] = useState<Church[]>([]);
  const [sel, setSel] = useState<Visitor | null>(null);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({ function: 'Membro', department: 'Geral', integrationDate: new Date().toISOString().split('T')[0] });

  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Visitor & { churchId?: string }>>({
    name: '', phone: '', email: '', region: '', source: '', wantsVisit: false, address: '', notes: '', date: new Date().toISOString().split('T')[0], culto: '', horario: '', churchId: ''
  });

  // WhatsApp Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMsg, setWaMsg] = useState('');

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const openWhatsApp = (name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    setWaPhone(cleanPhone);
    setWaMsg(`Olá, ${name}. ${getGreeting()}, como vai?`);
    setShowWaModal(true);
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/55${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
    setShowWaModal(false);
  };

  const [churchF, setChurchF] = useState(canSeeAllChurches ? 'all' : (currentUser?.churchId || ''));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [cultoFilter, setCultoFilter] = useState('ALL');
  const [horarioFilter, setHorarioFilter] = useState('ALL');
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Calcula horários dinâmicos da igreja selecionada
  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (churchF === 'ALL' || churchF === 'all') {
      svcs = dbChurches.flatMap(c => c.services || []);
    } else {
      const c = dbChurches.find(c => c.id === churchF);
      svcs = c?.services || [];
    }
    if (cultoFilter === 'ALL') {
      const times = new Set(svcs.map(s => s.time));
      return Array.from(times).sort();
    } else {
      const times = new Set(svcs.filter(s => s.name === cultoFilter).map(s => s.time));
      return Array.from(times).sort();
    }
  }, [churchF, cultoFilter, dbChurches]);

  // Lista dinâmica de nomes de cultos da igreja selecionada
  const availableCultos = useMemo(() => {
    let svcs: any[] = [];
    if (churchF === 'ALL' || churchF === 'all') {
      svcs = dbChurches.flatMap(c => c.services || []);
    } else {
      const c = dbChurches.find(c => c.id === churchF);
      svcs = c?.services || [];
    }
    const names = new Set(svcs.map(s => s.name));
    return Array.from(names).sort();
  }, [churchF, dbChurches]);

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);

  useEffect(() => {
    if (!canSeeAllChurches && currentUser?.churchId) {
      setChurchF(currentUser.churchId);
    }
  }, [canSeeAllChurches, currentUser]);

  useEffect(() => {
    async function fetchVisitors() {
      const { data: churchesDb } = await supabase.from('churches').select('*');
      const { data: servicesDb } = await supabase.from('church_services').select('*');

      if (churchesDb) {
        setDbChurches(churchesDb.map(c => {
          const svcs = (servicesDb || []).filter(s => s.church_id === c.id).map(s => ({
            id: s.id,
            name: s.name,
            dayOfWeek: s.day_of_week,
            time: s.time
          }));
          return {
            id: c.id,
            name: c.name,
            services: svcs
          } as any;
        }));
      }

      // Procuramos visitantes (membros com função de visitante ou em consolidação)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .in('function', ['Visitante (Kids)', 'Visitante', 'Ainda não definida']);
      
      if (data) {
        const formatados: Visitor[] = data.map(v => ({
          id: v.id,
          churchId: v.church_id || '1',
          date: v.integration_date || (v.created_at ? v.created_at.split('T')[0] : '2026-05-18'),
          name: v.name,
          phone: v.phone || '',
          email: v.email || '',
          region: v.state || 'Geral',
          source: v.ministry || 'Outro',
          wantsVisit: v.address ? true : false,
          status: v.status === 'ativo' ? 'membro' : v.status === 'pendente' ? 'em_conversao' : 'visitante',
          address: v.address || '',
          notes: v.function || '',
          culto: v.culto || '',
          horario: v.horario || ''
        }));
        setVisitors(formatados);
      }
    }

    fetchVisitors();
  }, []);

  const changeStatus = async (id: string, ns: VisitorStatus) => {
    // Atualiza status no Supabase
    const dbStatus = ns === 'membro' ? 'ativo' : 'pendente';
    const dbFunction = ns === 'visitante' ? 'Visitante' : 'Ainda não definida';

    const { error } = await supabase
      .from('members')
      .update({
        status: dbStatus,
        function: dbFunction
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
      return;
    }

    setVisitors(p => p.map(v => v.id === id ? { ...v, status: ns } : v));
    if (sel?.id === id) setSel(p => p ? { ...p, status: ns } : null);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel) return;

    const { error } = await supabase
      .from('members')
      .update({
        status: 'ativo',
        function: convertForm.function || 'Membro',
        ministry: convertForm.department || 'Geral',
        integration_date: convertForm.integrationDate
      })
      .eq('id', sel.id);

    if (error) {
      alert('Erro ao converter visitante para membro: ' + error.message);
      return;
    }
    
    setVisitors(p => p.map(v => v.id === sel.id ? { ...v, status: 'membro' } : v));
    setSel(null);
    setShowConvertModal(false);
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name || !newForm.phone || !newForm.region || !newForm.source) return;

    // Resolve a igreja correta (Superadmin escolhe da lista de congregações da modal)
    const activeChurch = newForm.churchId || (churchF !== 'all' && churchF !== 'ALL' ? churchF : (dbChurches[0]?.id || ''));
    if (!activeChurch) {
      alert('Nenhuma igreja selecionada ou disponível para o cadastro.');
      return;
    }

    const newId = 'v_' + Date.now().toString();
    const { data: newMemberDb, error } = await supabase
      .from('members')
      .insert({
        id: newId,
        name: newForm.name,
        phone: newForm.phone,
        email: newForm.email || '',
        state: newForm.region,
        ministry: newForm.source,
        address: newForm.address || '',
        function: 'Visitante',
        status: 'pendente',
        church_id: activeChurch,
        culto: newForm.culto || '',
        horario: newForm.horario || '',
        integration_date: newForm.date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error || !newMemberDb) {
      alert('Erro ao cadastrar novo visitante no banco: ' + (error?.message || 'Desconhecido'));
      return;
    }
    
    const newVisitor: Visitor = {
      id: newMemberDb.id,
      churchId: newMemberDb.church_id || '1',
      date: newMemberDb.integration_date || (newForm.date || new Date().toISOString().split('T')[0]),
      name: newForm.name,
      phone: newForm.phone,
      email: newForm.email || '',
      region: newForm.region,
      source: newForm.source,
      wantsVisit: !!newForm.wantsVisit,
      status: 'visitante',
      address: newForm.address || '',
      notes: newMemberDb.function || '',
      culto: newForm.culto || '',
      horario: newForm.horario || ''
    };
    
    setVisitors(p => [newVisitor, ...p]);
    setShowNewModal(false);
    setNewForm({ name: '', phone: '', email: '', region: '', source: '', wantsVisit: false, address: '', notes: '', date: new Date().toISOString().split('T')[0], culto: '', horario: '', churchId: '' });
  };

  const fmtDate = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const statusBadge = (s: VisitorStatus) => {
    const map = { visitante: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Visitante', border: 'rgba(59,130,246,0.3)' }, em_conversao: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12', label: 'Em Conversão', border: 'rgba(243,156,18,0.3)' }, membro: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', label: 'Membro', border: 'rgba(46,204,113,0.3)' } };
    const m = map[s];
    return <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', background: m.bg, color: m.color, fontWeight: '700', border: `1px solid ${m.border}` }}>{m.label}</span>;
  };

  // Estatísticas baseadas nos filtros globais, incluindo Culto e Horário
  const baseForStats = useMemo(() => {
    return visitors.filter(v => {
      if (churchF !== 'all' && churchF !== 'ALL' && v.churchId !== churchF) return false;
      
      // Filtros de cultos e horários
      if (cultoFilter !== 'ALL' && v.culto !== cultoFilter) return false;
      if (horarioFilter !== 'ALL' && v.horario && !v.horario.includes(horarioFilter)) return false;

      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.region.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [visitors, startDate, endDate, cultoFilter, horarioFilter, search, churchF]);

  const stats = useMemo(() => ({
    total: baseForStats.length,
    visitante: baseForStats.filter(v => v.status === 'visitante').length,
    conversao: baseForStats.filter(v => v.status === 'em_conversao').length,
    membro: baseForStats.filter(v => v.status === 'membro').length,
    wantVisit: baseForStats.filter(v => v.wantsVisit && v.status !== 'membro').length,
  }), [baseForStats]);

  // Filtro principal para a Lista Visual do Kanban
  const filtered = useMemo(() => {
    return baseForStats.filter(v => {
      if (filterStatus === 'all' && v.status === 'membro') return false; 
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      return true;
    });
  }, [baseForStats, filterStatus]);

  const activeChurchName = (cid: string) => dbChurches.find(c => c.id === cid)?.name || 'Igreja Local';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>

      {/* HEADER + STATS */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>👋 Gestão de Visitantes</h3>
            <button onClick={() => setShowNewModal(true)} style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              + Novo
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Acompanhe visitantes por período e culto</p>
        </div>
        {/* KPIs */}
        <div className="glass" style={{ display: 'flex', gap: '20px', padding: '12px 20px', alignItems: 'center' }}>
          <Kpi value={stats.total} label="Total" color="var(--primary-light)" />
          <Kpi value={stats.visitante} label="Visitantes" color="#3b82f6" />
          <Kpi value={stats.conversao} label="Em Conversão" color="#f39c12" />
          <Kpi value={stats.membro} label="Membros" color="#2ecc71" />
          <Kpi value={stats.wantVisit} label="Pedem Visita" color="#e74c3c" />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="glass" style={{ padding: '12px 14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Igreja */}
        {canSeeAllChurches ? (
          <select className="filter-select" style={{ padding:'7px 8px', fontSize:'0.8rem', minWidth:'140px' }} value={churchF} onChange={e => setChurchF(e.target.value)}>
            <option value="all">⛪ Todas as Igrejas</option>
            {dbChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <div className="filter-select" style={{ padding:'7px 8px', fontSize:'0.8rem', minWidth:'140px', opacity: 0.8, pointerEvents: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {dbChurches.find(c => c.id === churchF)?.name || 'Igreja Local'}
          </div>
        )}
        
        {/* Culto e Horário Dinâmicos */}
        <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem' }}>
          <option value="ALL">Todos os Cultos</option>
          {availableCultos.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem' }}>
          <option value="ALL">Todos os Horários</option>
          {availableHorarios.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        
        {/* Datas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="search-input glass-input" style={{ padding: '6px 8px', fontSize: '0.8rem', colorScheme: 'dark' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="search-input glass-input" style={{ padding: '6px 8px', fontSize: '0.8rem', colorScheme: 'dark' }} />
        </div>
        {/* Status */}
        <select className="filter-select" style={{ padding: '7px 8px', fontSize: '0.8rem', minWidth: '120px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">🏷️ Todos</option>
          <option value="visitante">Visitante</option>
          <option value="em_conversao">Em Conversão</option>
          <option value="membro">Membro</option>
        </select>
        {/* Busca */}
        <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', opacity: 0.4 }}>🔍</span>
          <input type="text" placeholder="Buscar..." className="search-input glass-input" style={{ width: '100%', padding: '7px 7px 7px 28px', fontSize: '0.8rem' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* 2 COLUNAS KANBAN RESTAURADAS */}
      <div className="responsive-grid" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* COLUNA 1: VISITANTES */}
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', padding: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />Visitante (1º Contato)
            </h4>
            <span className="badge" style={{ background: '#3b82f6', padding: '2px 7px', fontSize: '0.65rem', margin: 0, color: '#fff' }}>{filtered.filter(v => v.status === 'visitante').length}</span>
          </div>
          <div className="scroll-container" style={{ flex: 1, paddingRight: '4px' }}>
            {filtered.filter(v => v.status === 'visitante').length > 0 ? filtered.filter(v => v.status === 'visitante').map(v => {
              const isSel = sel?.id === v.id;
              return (
                <div key={v.id} className={`glass member-card ${isSel ? 'card-selected' : ''}`} style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'center', gap: '14px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setSel(v)}>
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
                    {v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                      {statusBadge(v.status)}
                      {v.wantsVisit && v.status !== 'membro' && <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', fontWeight: '700', border: '1px solid rgba(231,76,60,0.3)' }}>VISITA</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 {v.region} · 📅 {fmtDate(v.date)}
                      {v.culto && ` · ⛪ ${v.culto} (${v.horario})`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button 
                      onClick={e => { e.stopPropagation(); changeStatus(v.id, 'em_conversao'); }} 
                      style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}
                      title="Avançar para Conversão"
                    >
                      ➡️
                    </button>
                    <button 
                      onClick={e => { e.stopPropagation(); openWhatsApp(v.name, v.phone); }} 
                      style={{ width:'28px', height:'28px', borderRadius:'50%', border:'1.5px solid #25d366', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#25d366'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#25d366'; }}
                      title="Abrir WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>👋</div>
                <p style={{ fontSize: '0.85rem' }}>Nenhum visitante</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: EM CONVERSÃO */}
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', padding: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f39c12', display: 'inline-block' }} />Em Conversão
            </h4>
            <span className="badge" style={{ background: '#f39c12', padding: '2px 7px', fontSize: '0.65rem', margin: 0, color: '#fff' }}>{filtered.filter(v => v.status === 'em_conversao').length}</span>
          </div>
          <div className="scroll-container" style={{ flex: 1, paddingRight: '4px' }}>
            {filtered.filter(v => v.status === 'em_conversao').length > 0 ? filtered.filter(v => v.status === 'em_conversao').map(v => {
              const isSel = sel?.id === v.id;
              return (
                <div key={v.id} className={`glass member-card ${isSel ? 'card-selected' : ''}`} style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'center', gap: '14px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setSel(v)}>
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
                    {v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                      {v.wantsVisit && <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', fontWeight: '700', border: '1px solid rgba(231,76,60,0.3)' }}>VISITA</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 {v.region} · 📅 {fmtDate(v.date)}
                      {v.culto && ` · ⛪ ${v.culto} (${v.horario})`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button 
                      onClick={e => { e.stopPropagation(); openWhatsApp(v.name, v.phone); }} 
                      style={{ width:'28px', height:'28px', borderRadius:'50%', border:'1.5px solid #25d366', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#25d366'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#25d366'; }}
                      title="Abrir WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>👋</div>
                <p style={{ fontSize: '0.85rem' }}>Nenhum visitante em conversão</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* DETAIL MODAL */}
      {sel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '15px', position: 'relative' }}>
            <button onClick={() => setSel(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                {statusBadge(sel.status)}
                <h3 style={{ fontSize: '1.25rem', margin: '6px 0 2px 0' }}>{sel.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>⛪ {activeChurchName(sel.churchId)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {sel.culto && (
                  <div className="glass" style={{ padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--primary-light)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Culto e Horário da Visita</div>
                    <div style={{ color: '#fff', fontWeight: '500', marginTop: '3px' }}>{sel.culto} ({sel.horario})</div>
                  </div>
                )}
                
                <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
                  <strong>WhatsApp:</strong> {sel.phone}
                </div>
                {sel.email && (
                  <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
                    <strong>E-mail:</strong> {sel.email}
                  </div>
                )}
                <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
                  <strong>Região / Bairro:</strong> {sel.region}
                </div>
                <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
                  <strong>Como Conheceu:</strong> {sel.source}
                </div>
                {sel.address && (
                  <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
                    <strong>Endereço Completo:</strong> {sel.address}
                  </div>
                )}
              </div>

              {sel.status !== 'membro' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {sel.status === 'visitante' && (
                    <button 
                      onClick={() => changeStatus(sel.id, 'em_conversao')}
                      style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#e67e22', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ⚡ Vincular Célula
                    </button>
                  )}
                  <button 
                    onClick={() => setShowConvertModal(true)}
                    style={{ flex: 1.2, padding: '10px', border: 'none', borderRadius: '8px', background: '#2ecc71', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    🎉 Integrar como Membro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONVERT MODAL */}
      {showConvertModal && sel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleConvertSubmit} className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '380px', margin: '15px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.15rem' }}>🎉 Integrar {sel.name}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>Defina a função, departamento e a data de batismo/integração.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Função / Cargo</label>
                <select value={convertForm.function} onChange={e => setConvertForm(p => ({ ...p, function: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                  <option value="Membro">Membro</option>
                  <option value="Obreiro(a)">Obreiro(a)</option>
                  <option value="Diácono(a)">Diácono(a)</option>
                  <option value="Presbítero">Presbítero</option>
                </select>
              </div>
              <div>
                <label className="input-label">Ministério Inicial</label>
                <select value={convertForm.department} onChange={e => setConvertForm(p => ({ ...p, department: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                  {(dbChurches.find(c => c.id === sel.churchId)?.departments || ['Louvor', 'Obreiros', 'Infantil', 'Mídia']).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Data de Batismo / Integração</label>
                <input type="date" value={convertForm.integrationDate} onChange={e => setConvertForm(p => ({ ...p, integrationDate: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px', colorScheme: 'dark' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowConvertModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1.5, padding: '10px', border: 'none', background: '#2ecc71', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Confirmar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* NEW VISITOR MODAL (Com a correção de Chave Estrangeira e Seleção de Igreja) */}
      {showNewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleNewSubmit} className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '440px', margin: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '4px' }}>➕ Adicionar Visitante</h3>
            
            {/* Seletor de Igreja para Superadmin sob filtro global */}
            {canSeeAllChurches && (churchF === 'all' || churchF === 'ALL') ? (
              <div>
                <label className="input-label">Congregação / Igreja *</label>
                <select 
                  value={newForm.churchId || ''} 
                  onChange={e => {
                    const cid = e.target.value;
                    setNewForm(p => ({ ...p, churchId: cid, culto: '', horario: '' }));
                  }} 
                  required 
                  className="search-input glass-input" 
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">Selecione a igreja...</option>
                  {dbChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Congregação:</strong> {activeChurchName(churchF !== 'all' ? churchF : (dbChurches[0]?.id || ''))}
              </div>
            )}

            <div>
              <label className="input-label">Nome Completo *</label>
              <input type="text" value={newForm.name || ''} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} required className="search-input glass-input" style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Telefone (WhatsApp) *</label>
                <input type="text" value={newForm.phone || ''} onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} required className="search-input glass-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">E-mail</label>
                <input type="email" value={newForm.email || ''} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Bairro / Região *</label>
                <input type="text" value={newForm.region || ''} onChange={e => setNewForm(p => ({ ...p, region: e.target.value }))} required className="search-input glass-input" style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Como Conheceu?</label>
                <select value={newForm.source || ''} onChange={e => setNewForm(p => ({ ...p, source: e.target.value }))} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                  <option value="Amigos / Parentes">Amigos / Parentes</option>
                  <option value="Redes Sociais">Redes Sociais</option>
                  <option value="Passou em frente">Passou em frente</option>
                  <option value="Convite especial">Convite especial</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Culto e Horário Dinâmicos para a Modal */}
            {(() => {
              const targetChurchId = newForm.churchId || (churchF !== 'all' && churchF !== 'ALL' ? churchF : (dbChurches[0]?.id || ''));
              const modalAvailableServices = dbChurches.find(c => c.id === targetChurchId)?.services || [];
              const modalAvailableCultos = Array.from(new Set(modalAvailableServices.map(s => s.name))).sort();

              if (modalAvailableCultos.length === 0) return null;

              return (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Culto da Visita</label>
                    <select 
                      value={newForm.culto || ''} 
                      onChange={e => {
                        const selectedVal = e.target.value;
                        const relatedSvc = modalAvailableServices.find(s => s.name === selectedVal);
                        setNewForm(p => ({ 
                          ...p, 
                          culto: selectedVal,
                          horario: relatedSvc ? `${relatedSvc.dayOfWeek} às ${relatedSvc.time}` : '' 
                        }));
                      }}
                      className="search-input glass-input" 
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="">Selecione o culto...</option>
                      {modalAvailableCultos.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Horário Autogerado</label>
                    <input type="text" value={newForm.horario || ''} readOnly className="search-input glass-input" style={{ width: '100%', padding: '8px', opacity: 0.7, background: 'rgba(255,255,255,0.02)' }} placeholder="Selecione o culto acima" />
                  </div>
                </div>
              );
            })()}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', margin: '4px 0' }}>
                <input type="checkbox" checked={newForm.wantsVisit || false} onChange={e => setNewForm(p => ({ ...p, wantsVisit: e.target.checked }))} />
                Deseja receber visita (Célula/Secretaria)?
              </label>
            </div>

            {newForm.wantsVisit && (
              <div>
                <label className="input-label">Endereço Completo *</label>
                <textarea value={newForm.address || ''} onChange={e => setNewForm(p => ({ ...p, address: e.target.value }))} required className="search-input glass-input" style={{ width: '100%', padding: '8px', fontFamily: 'inherit', resize: 'vertical' }} rows={2} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button type="submit" style={{ flex: 1.5, padding: '10px', border: 'none', background: '#2ecc71', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Salvar Visitante</button>
            </div>
          </form>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {showWaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '15px' }}>
            <h3 style={{ marginTop: 0, color: '#25d366', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>Mensagem WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Edite a mensagem abaixo antes de enviar:</p>
            <textarea value={waMsg} onChange={e => setWaMsg(e.target.value)} className="search-input glass-input" style={{ padding: '12px', width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowWaModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button type="button" onClick={sendWhatsApp} style={{ background: '#25d366', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ value, label, color }: { value: number, label: string, color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}
