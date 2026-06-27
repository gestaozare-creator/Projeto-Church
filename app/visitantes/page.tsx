"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type VisitorStatus = 'visitante' | 'em_conversao' | 'membro';

interface Visitor {
  id: string;
  churchId: string;
  date: string;
  cultId: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  source: string;
  wantsVisit: boolean;
  status: VisitorStatus;
  address: string;
  notes: string;
}

const CULTS_DEFAULT = [
  { id: 'c1', time: '09:00', name: 'Culto da Manhã' },
  { id: 'c2', time: '18:00', name: 'Culto da Família' },
  { id: 'c3', time: '20:00', name: 'Culto de Ensino' }
];

export default function Visitantes() {
  const { currentUser, canSeeAllChurches } = useAuth();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [dbChurches, setDbChurches] = useState<any[]>([]);
  const [cults] = useState(CULTS_DEFAULT);
  const [sel, setSel] = useState<Visitor | null>(null);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({ function: 'Membro', department: 'Geral', integrationDate: new Date().toISOString().split('T')[0] });

  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Visitor>>({
    name: '', phone: '', email: '', region: '', source: '', wantsVisit: false, address: '', notes: '', date: new Date().toISOString().split('T')[0], cultId: CULTS_DEFAULT[0].id
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
      const dayName = cultoFilter === 'domingo' ? 'Domingo' : 
                      cultoFilter === 'quarta' ? 'Quarta-feira' : 
                      cultoFilter === 'sabado' ? 'Sábado' : '';
      
      const times = new Set(svcs.filter(s => s.dayOfWeek === dayName).map(s => s.time));
      return Array.from(times).sort();
    }
  }, [churchF, cultoFilter, dbChurches]);

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);
  // Efeito para sincronizar filtro caso a flag mude
  useEffect(() => {
    if (!canSeeAllChurches && currentUser?.churchId) {
      setChurchF(currentUser.churchId);
    }
  }, [canSeeAllChurches, currentUser]);

  useEffect(() => {
    async function fetchVisitors() {
      const { data: churchesDb } = await supabase.from('churches').select('*');
      if (churchesDb) {
        setDbChurches(churchesDb.map(c => ({ id: c.id, name: c.name, services: [] })));
      }

      // Procuramos membros com a função de visitante ou em consolidação (status pendente/ativo)
      // Como na nossa tabela colocamos a função 'Visitante (Kids)' ou nula, buscamos aqui
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .in('function', ['Visitante (Kids)', 'Visitante', 'Ainda não definida']);
      
      if (data) {
        const formatados: Visitor[] = data.map(v => ({
          id: v.id,
          churchId: v.church_id || '1',
          date: v.created_at ? new Date(v.created_at).toISOString().split('T')[0] : '2026-05-18',
          cultId: 'c1', // Padrão
          name: v.name,
          phone: v.phone || '',
          email: v.email || '',
          region: v.state || 'Geral',
          source: v.ministry || 'Outro',
          wantsVisit: true,
          status: v.status === 'ativo' ? 'membro' : v.status === 'pendente' ? 'em_conversao' : 'visitante',
          address: v.address || '',
          notes: v.function || ''
        }));
        setVisitors(formatados);
      }
    }

    fetchVisitors();
  }, []);

  // Estatísticas baseadas nos filtros globais (ignorando aba status para não zerar os cards)
  const baseForStats = useMemo(() => {
    return visitors.filter(v => {
      if (churchF !== 'all' && churchF !== 'ALL' && v.churchId !== churchF) return false;
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

  // Filtro principal para a Lista Visual
  const filtered = useMemo(() => {
    return baseForStats.filter(v => {
      if (filterStatus === 'all' && v.status === 'membro') return false; 
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      return true;
    });
  }, [baseForStats, filterStatus]);

  const changeStatus = async (id: string, ns: VisitorStatus) => {
    if (ns === 'membro') {
      setShowConvertModal(true);
      return;
    }

    const { error } = await supabase
      .from('members')
      .update({
        status: ns === 'em_conversao' ? 'pendente' : 'inativo',
        function: ns === 'em_conversao' ? 'Visitante (Kids)' : 'Visitante'
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status do visitante: ' + error.message);
      return;
    }

    setVisitors(p => p.map(v => v.id === id ? { ...v, status: ns } : v));
    if (sel?.id === id) setSel(p => p ? { ...p, status: ns } : null);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel) return;

    // Atualizar no Supabase para membro oficial ('ativo')
    const { error } = await supabase
      .from('members')
      .update({
        status: 'ativo',
        function: convertForm.function || 'Membro',
        ministry: convertForm.department || 'Geral'
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
        status: 'pendente', // 'pendente' = visitante (em_conversao)
        church_id: currentUser?.churchId || '1'
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
      date: newMemberDb.created_at ? new Date(newMemberDb.created_at).toISOString().split('T')[0] : (newForm.date || new Date().toISOString().split('T')[0]),
      cultId: newForm.cultId || CULTS_DEFAULT[0].id,
      name: newForm.name,
      phone: newForm.phone,
      email: newForm.email || '',
      region: newForm.region,
      source: newForm.source,
      wantsVisit: !!newForm.wantsVisit,
      status: 'visitante',
      address: newForm.address || '',
      notes: newMemberDb.function || ''
    };
    
    setVisitors(p => [newVisitor, ...p]);
    setShowNewModal(false);
    setNewForm({ name: '', phone: '', email: '', region: '', source: '', wantsVisit: false, address: '', notes: '', date: new Date().toISOString().split('T')[0], cultId: CULTS_DEFAULT[0].id });
  };

  const getCultName = (id: string) => cults.find(c => c.id === id)?.name || '';
  const getCultTime = (id: string) => cults.find(c => c.id === id)?.time || '';
  const fmtDate = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const statusBadge = (s: VisitorStatus) => {
    const map = { visitante: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Visitante', border: 'rgba(59,130,246,0.3)' }, em_conversao: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12', label: 'Em Conversão', border: 'rgba(243,156,18,0.3)' }, membro: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', label: 'Membro', border: 'rgba(46,204,113,0.3)' } };
    const m = map[s];
    return <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', background: m.bg, color: m.color, fontWeight: '700', border: `1px solid ${m.border}` }}>{m.label}</span>;
  };

  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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
        
        {/* Culto e Horário */}
        <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem' }}>
          <option value="ALL">Cultos</option>
          <option value="domingo">Domingo</option>
          <option value="quarta">Quarta-feira</option>
          <option value="sabado">Sábado</option>
        </select>
        <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem' }}>
          <option value="ALL">Horários</option>
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

      {/* 2 COLUNAS KANBAN */}
      <div className="responsive-grid" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* COLUNA 1: VISITANTES (FASE 1) */}
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
                  {/* Iniciais como avatar */}
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
                      📍 {v.region} · 📅 {fmtDate(v.date)} · 🕒 {getCultTime(v.cultId)}
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

        {/* COLUNA 2: EM CONVERSÃO (FASE 2) */}
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
                  {/* Iniciais como avatar */}
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
                    {v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                      {v.wantsVisit && <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', fontWeight: '700', border: '1px solid rgba(231,76,60,0.3)' }}>VISITA</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 {v.region} · 📅 {fmtDate(v.date)} · 🕒 {getCultTime(v.cultId)}
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
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>⛪</div>
                <p style={{ fontSize: '0.85rem' }}>Nenhum visitante em conversão</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* POP-UP DETALHES DO VISITANTE */}
      {sel && !showConvertModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', margin: '15px', position: 'relative' }}>
            <button onClick={() => setSel(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            
            <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
              {/* Avatar + Nome */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '2rem', margin: '0 auto 12px', border: '3px solid var(--primary-light)' }}>
                  {sel.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{sel.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  {statusBadge(sel.status)}
                  {sel.wantsVisit && sel.status !== 'membro' && <span style={{ fontSize: '0.6rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', fontWeight: '700', border: '1px solid rgba(231,76,60,0.3)' }}>🏠 QUER VISITA</span>}
                </div>
              </div>

              {/* Info cards */}
              <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                <InfoCard label="Contato" value={`📞 ${sel.phone}${sel.email ? '\n✉️ ' + sel.email : ''}`} />
                <InfoCard label="Região / Endereço" value={`📍 ${sel.region}\n🏠 ${sel.address}`} />
                <InfoCard label="Culto" value={`📅 ${fmtDate(sel.date)}\n🕒 ${getCultTime(sel.cultId)} — ${getCultName(sel.cultId)}`} />
                <InfoCard label="Como conheceu" value={sel.source} />
                {sel.notes && <InfoCard label="Observações" value={sel.notes} />}
                
                {/* Ações de status (somente no pop-up) */}
                <div style={{ marginTop: '4px', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Alterar Status</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['visitante', 'em_conversao'] as VisitorStatus[]).map(s => {
                      const labels: Record<string, string> = { visitante: 'Visitante', em_conversao: 'Em Conversão', membro: 'Membro' };
                      const colors: Record<string, string> = { visitante: '#3b82f6', em_conversao: '#f39c12', membro: '#2ecc71' };
                      const isActive = sel.status === s;
                      return (
                        <button key={s} onClick={() => changeStatus(sel.id, s)} style={{
                          flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                          background: isActive ? colors[s] : 'transparent', color: isActive ? '#fff' : colors[s],
                          border: `1px solid ${colors[s]}40`
                        }}>{labels[s]}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexShrink: 0 }}>
                <button className="modal-btn" style={{ flex: 1, margin: 0, padding: '10px', fontSize: '0.8rem', backgroundColor: '#25d366' }} onClick={() => openWhatsApp(sel.name, sel.phone)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" style={{flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
                </button>
                {sel.status !== 'membro' && (
                  <button className="modal-btn" style={{ flex: 1, margin: 0, padding: '10px', fontSize: '0.8rem' }} onClick={() => changeStatus(sel.id, 'membro')}>
                    👤 Tornar Membro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP DE CONVERSÃO PARA MEMBRO */}
      {showConvertModal && sel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px', margin: '15px' }}>
            <h3 style={{ marginTop: 0, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 Efetivação de Membro</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Integre <strong>{sel.name}</strong> oficialmente como membro da igreja preenchendo os dados ministeriais.</p>
            
            <form onSubmit={handleConvertSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Função Eclesiástica</label>
                    <select value={convertForm.function} onChange={e => setConvertForm({...convertForm, function: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                      <option>Membro</option><option>Obreiro(a)</option><option>Diácono/Diaconisa</option><option>Presbítero</option><option>Pastor(a)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Departamento/Ministério</label>
                    <select value={convertForm.department} onChange={e => setConvertForm({...convertForm, department: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                      <option>Geral</option><option>Louvor</option><option>Infantil (Kids)</option><option>Jovens</option><option>Mídia / Comunicação</option><option>Recepção</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Data Oficial de Integração</label>
                  <input type="date" required value={convertForm.integrationDate} onChange={e => setConvertForm({...convertForm, integrationDate: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowConvertModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ background: '#2ecc71', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Confirmar Integração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP NOVO VISITANTE */}
      {showNewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '600px', margin: '15px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>👋 Cadastrar Novo Visitante</h3>
            
            <form onSubmit={handleNewSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome Completo *</label>
                  <input required value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>WhatsApp / Celular *</label>
                  <input required type="tel" value={newForm.phone} onChange={e => setNewForm({...newForm, phone: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} placeholder="(11) 99999-9999" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Email (Opcional)</label>
                  <input type="email" value={newForm.email} onChange={e => setNewForm({...newForm, email: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Região / Bairro *</label>
                  <input required value={newForm.region} onChange={e => setNewForm({...newForm, region: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} placeholder="Ex: Zona Norte, Bela Vista..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Endereço Completo (Opcional)</label>
                  <input value={newForm.address} onChange={e => setNewForm({...newForm, address: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Data da Visita *</label>
                  <input required type="date" value={newForm.date} onChange={e => setNewForm({...newForm, date: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Culto / Reunião *</label>
                  <select value={newForm.cultId} onChange={e => setNewForm({...newForm, cultId: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    {cults.map(c => <option key={c.id} value={c.id}>{c.time} - {c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Como nos conheceu? *</label>
                  <select required value={newForm.source} onChange={e => setNewForm({...newForm, source: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <option value="">Selecione...</option>
                    <option>Convite de Membro</option>
                    <option>Redes Sociais (Instagram, Facebook)</option>
                    <option>Google / Site</option>
                    <option>Passou na frente</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={newForm.wantsVisit} onChange={e => setNewForm({...newForm, wantsVisit: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    Deseja receber Visita Pastoral?
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Observações (Opcional)</label>
                <textarea value={newForm.notes} onChange={e => setNewForm({...newForm, notes: e.target.value})} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', minHeight: '60px', resize: 'vertical' }} placeholder="Algum pedido de oração ou informação extra..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Salvar Visitante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP */}
      {showWaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '15px' }}>
            <h3 style={{ marginTop: 0, color: '#25d366', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><svg viewBox="0 0 24 24" width="20" height="20" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Mensagem WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Edite a mensagem abaixo antes de enviar:</p>
            <textarea 
              value={waMsg} 
              onChange={e => setWaMsg(e.target.value)} 
              className="search-input glass-input" 
              style={{ padding: '12px', width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowWaModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button type="button" onClick={sendWhatsApp} style={{ background: '#25d366', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Enviar
              </button>
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

function InfoCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.75rem', whiteSpace: 'pre-line' }}>{value}</div>
    </div>
  );
}
