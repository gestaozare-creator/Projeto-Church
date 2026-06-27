"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface DBVisitor {
  id: string;
  churchId: string;
  date: string;
  status: string;
}

function DonutChart({ title, data, total }: { title: string; data: { key: string; label: string; value: number; color: string }[]; total: number }) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const slices = useMemo(() => {
    const safeTotal = total || 1;
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };
    
    const result = [];
    for (const item of data) {
      if (item.value === 0) continue;
      
      const startPercent = cumulativePercent;
      const slicePercent = item.value / safeTotal;
      cumulativePercent += slicePercent;
      const endPercent = cumulativePercent;

      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(endPercent);
      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
      
      let pathData = '';
      if (slicePercent === 1) {
        pathData = `M 1 0 A 1 1 0 1 1 1 -0.0001`;
      } else {
        pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
        ].join(' ');
      }
      
      result.push({ ...item, percent: slicePercent, pathData });
    }
    return result;
  }, [data, total]);

  const hoveredData = slices.find(s => s.key === hoveredSlice);

  return (
    <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ fontSize: '0.9rem', margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '20px' }}>
        {slices.length > 0 ? (
          <>
            <div style={{ position: 'relative', height: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ height: '100%', width: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <defs>
                  <mask id={`donutMask-${title.replace(/[^a-z0-9]/gi, '')}`}>
                    <rect x="-1.5" y="-1.5" width="3" height="3" fill="white" />
                    <circle cx="0" cy="0" r="0.65" fill="black" />
                  </mask>
                </defs>
                <g mask={`url(#donutMask-${title.replace(/[^a-z0-9]/gi, '')})`}>
                  {slices.map((slice, i) => {
                    const isHovered = hoveredSlice === slice.key;
                    const scale = isHovered ? 'scale(1.08)' : 'scale(1)';
                    return (
                      <path 
                        key={i} 
                        d={slice.pathData} 
                        fill={slice.color} 
                        style={{ cursor: 'pointer', transform: scale, transformOrigin: 'center', transition: 'transform 0.2s' }}
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </g>
              </svg>
              {/* Texto Central */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center', width: '60%' }}>
                {hoveredData ? (
                  <>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: '1.2' }}>{hoveredData.label}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: hoveredData.color, lineHeight: '1.2' }}>{(hoveredData.percent * 100).toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: '1.2' }}>Total</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{total}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Legenda Lateral */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '140px' }}>
              {data.map((item, i) => {
                if (item.value === 0) return null;
                const isHovered = hoveredSlice === item.key;
                return (
                  <div 
                    key={i} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: (hoveredSlice && !isHovered) ? 0.3 : 1, transition: 'opacity 0.2s' }}
                    onMouseEnter={() => setHoveredSlice(item.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Sem dados</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardSecretariaPage() {
  const { currentUser, canSeeAllChurches } = useAuth();
  
  const [church, setChurch] = useState(canSeeAllChurches ? 'ALL' : (currentUser?.churchId || ''));
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

  const [dbChurches, setDbChurches] = useState<any[]>([]);

  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = dbChurches.flatMap(c => c.services || []);
    } else {
      const c = dbChurches.find(c => c.id === church);
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
  }, [church, cultoFilter, dbChurches]);

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);
  
  // Estados para o Gráfico Comparativo
  const [cmpYear1, setCmpYear1] = useState('2026');
  const [cmpYear2, setCmpYear2] = useState('2025');
  const [chartType, setChartType] = useState<'barra' | 'linha'>('linha');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!canSeeAllChurches && currentUser?.churchId) {
      setChurch(currentUser.churchId);
    }
  }, [canSeeAllChurches, currentUser]);

  const [members, setMembers] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<DBVisitor[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      // Carregar igrejas do Supabase
      const { data: churchesDb } = await supabase.from('churches').select('*');
      if (churchesDb) {
        setDbChurches(churchesDb.map(c => ({
          id: c.id,
          name: c.name,
          isHeadquarters: c.is_headquarters,
          services: [] // Add parsing if needed or keep empty
        })));
      }

      // Carregar membros do Supabase
      const { data: membersDb } = await supabase
        .from('members')
        .select('*');
      if (membersDb) {
        setMembers(membersDb.map(m => ({
          id: m.id,
          churchId: m.church_id || '1',
          name: m.name,
          status: m.status,
          ministry: m.ministry,
          function: m.function,
          integrationDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '2026-01-01'
        })));
      }

      // Buscar visitantes (membros temporários ou pendentes criados no Kids/Secretaria)
      const { data: visitorsDb } = await supabase
        .from('members')
        .select('*')
        .eq('function', 'Visitante (Kids)');
      
      if (visitorsDb) {
        setVisitors(visitorsDb.map(v => ({
          id: v.id,
          churchId: v.church_id || '1',
          date: v.created_at ? new Date(v.created_at).toISOString().split('T')[0] : '2026-01-01',
          status: v.status === 'ativo' ? 'membro' : v.status === 'pendente' ? 'em_conversao' : 'visitante'
        })));
      }
    }
    
    fetchDashboardData();
  }, []);

  // 1. Filtrar Membros (Global e por período)
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (church !== 'ALL' && m.churchId !== church) return false;
      const date = m.integrationDate || '2026-01-01'; // Fallback se não tiver data
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [members, church, startDate, endDate, cultoFilter, horarioFilter]);

  // 2. Filtrar Visitantes (Global e por período)
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      if (church !== 'ALL' && v.churchId !== church) return false;
      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;
      return true;
    });
  }, [visitors, church, startDate, endDate, cultoFilter, horarioFilter]);

  // --- KPIs Principais ---
  const kpiMembrosAtivos = filteredMembers.filter(m => m.status === 'ativo').length;
  const kpiMembrosInativos = filteredMembers.filter(m => m.status === 'inativo').length;
  const kpiMembrosPendentes = filteredMembers.filter(m => m.status === 'pendente').length;
  
  // --- Gráfico de Ministérios ---
  const ministriesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.filter(m => m.status === 'ativo').forEach(m => {
      const min = m.ministry || 'Sem Ministério';
      map.set(min, (map.get(min) || 0) + 1);
    });
    
    const colors = ['#3498db', '#9b59b6', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'];
    let total = 0;
    const slices = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).map(([key, val], i) => {
      total += val;
      return { key, label: key, value: val, color: colors[i % colors.length] };
    });
    
    return { slices, total };
  }, [filteredMembers]);

  // --- Gráfico de Funções/Departamentos ---
  const functionsData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.filter(m => m.status === 'ativo').forEach(m => {
      const func = m.function || 'Indefinida';
      map.set(func, (map.get(func) || 0) + 1);
    });
    
    const colors = ['#1abc9c', '#34495e', '#16a085', '#27ae60', '#2980b9'];
    let total = 0;
    const slices = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).map(([key, val], i) => {
      total += val;
      return { key, label: key, value: val, color: colors[i % colors.length] };
    });
    
    return { slices, total };
  }, [filteredMembers]);

  // --- Funil de Visitantes ---
  const visitorFunnel = useMemo(() => {
    const total = filteredVisitors.length;
    const conversao = filteredVisitors.filter(v => v.status === 'em_conversao').length;
    const membros = filteredVisitors.filter(v => v.status === 'membro').length;
    
    return [
      { label: 'Visitantes', count: total, color: '#3498db', percent: 100 },
      { label: 'Em Conversão', count: conversao, color: '#f39c12', percent: total > 0 ? (conversao / total) * 100 : 0 },
      { label: 'Membros (Consolidados)', count: membros, color: '#2ecc71', percent: total > 0 ? (membros / total) * 100 : 0 },
    ];
  }, [filteredVisitors]);

  // --- Lógica do Gráfico Comparativo Mês a Mês ---
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  
  const comparativeData = useMemo(() => {
    const data = months.map(m => ({ 
      month: m, 
      year1: null as number | null, 
      year2: null as number | null,
      members: null as number | null,
      visitors: null as number | null
    }));
    
    // Contabilizar entradas de Membros e Visitantes que contam como crescimento
    const countData = (yearTarget: string, yearKey: 'year1' | 'year2') => {
      members.forEach(m => {
        if (church !== 'ALL' && m.churchId !== church) return;
        const d = m.integrationDate || '2026-01-01';
        if (d.startsWith(yearTarget)) {
          const mIdx = parseInt(d.split('-')[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            
            if (yearKey === 'year1') {
              if (data[mIdx].members === null) data[mIdx].members = 0;
              data[mIdx].members!++;
            }
          }
        }
      });
      visitors.forEach(v => {
        if (church !== 'ALL' && v.churchId !== church) return;
        if (v.date.startsWith(yearTarget)) {
          const mIdx = parseInt(v.date.split('-')[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            
            if (yearKey === 'year1') {
              if (data[mIdx].visitors === null) data[mIdx].visitors = 0;
              data[mIdx].visitors!++;
            }
          }
        }
      });
    };

    countData(cmpYear1, 'year1');
    countData(cmpYear2, 'year2');

    return data;
  }, [members, visitors, cmpYear1, cmpYear2, church]);

  const maxCmpValue = Math.max(...comparativeData.map(d => Math.max(d.year1 || 0, d.year2 || 0)), 1);
  const maxTypeValues = Math.max(...comparativeData.map(d => Math.max(d.members || 0, d.visitors || 0)), 1);

  // Auxiliar para SVG de Linha Suave
  const buildSmoothLinePath = (yearKey: 'year1' | 'year2' | 'members' | 'visitors', maxVal: number) => {
    if (comparativeData.length === 0) return '';
    
    const points = comparativeData.map((d, i) => {
      const val = d[yearKey];
      if (val === null) return null;
      const x = (i / 11) * 100;
      const y = 90 - (val / maxVal) * 80;
      return { x, y };
    });

    const segments: {x:number, y:number}[][] = [];
    let currentSegment: {x:number, y:number}[] = [];
    for (const pt of points) {
      if (pt) {
        currentSegment.push(pt);
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    let path = '';
    for (const segment of segments) {
      if (segment.length === 0) continue;
      if (segment.length === 1) {
        path += `M ${segment[0].x},${segment[0].y} `;
        continue;
      }
      
      path += `M ${segment[0].x},${segment[0].y} `;
      for (let i = 0; i < segment.length - 1; i++) {
        const p0 = segment[i === 0 ? 0 : i - 1];
        const p1 = segment[i];
        const p2 = segment[i + 1];
        const p3 = segment[i + 2 < segment.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
      }
    }
    return path;
  };

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px', padding: '10px 10px 30px', overflowY: 'auto' }}>
      
      {/* HEADER E FILTROS GERAIS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', margin: 0 }}>📈 Dashboard da Secretaria</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Análise de membros, ministérios e conversões</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* FILTRO DE IGREJA */}
          {canSeeAllChurches ? (
            <select value={church} onChange={e => setChurch(e.target.value)} className="search-input glass-input" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <option value="ALL">⛪ Todas as Igrejas</option>
              {dbChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="search-input glass-input" style={{ padding: '8px 14px', fontSize: '0.85rem', opacity: 0.8, pointerEvents: 'none', background: 'rgba(255,255,255,0.05)' }}>
              {dbChurches.find(c => c.id === church)?.name || 'Igreja Local'}
            </div>
          )}
          
          {/* FILTRO DE CULTO E HORÁRIO */}
          <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <option value="ALL">Todos os Cultos</option>
            <option value="domingo">Domingo</option>
            <option value="quarta">Quarta-feira</option>
            <option value="sabado">Sábado</option>
          </select>
          <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <option value="ALL">Todos os Horários</option>
            {availableHorarios.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          
          {/* FILTROS DE DATA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="search-input glass-input" style={{ padding: '6px 10px', fontSize: '0.85rem', colorScheme: 'dark' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="search-input glass-input" style={{ padding: '6px 10px', fontSize: '0.85rem', colorScheme: 'dark' }} />
          </div>
        </div>
      </div>

      {/* KPIs DE MEMBRESIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>👥 Total de Membros</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3498db', margin: '4px 0' }}>{filteredMembers.length}</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>✅ Ativos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2ecc71', margin: '4px 0' }}>{kpiMembrosAtivos}</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>⏳ Em Migração</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f39c12', margin: '4px 0' }}>{kpiMembrosPendentes}</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>🚫 Inativos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e74c3c', margin: '4px 0' }}>{kpiMembrosInativos}</div>
        </div>
      </div>

      {/* BLOCO CENTRAL: GRÁFICOS E FUNIL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* GRÁFICOS DE ROSCA */}
        <DonutChart title="🕊️ Membros por Ministérios" data={ministriesData.slices} total={ministriesData.total} />
        <DonutChart title="🏢 Membros por Funções/Depart." data={functionsData.slices} total={functionsData.total} />
        
        {/* FUNIL DE CONVERSÃO DE VISITANTES */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.9rem', margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>🎯 Funil de Conversão (Visitantes)</h4>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
            {visitorFunnel.map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600, color: step.color }}>{step.label}</span>
                  <span style={{ fontWeight: 800 }}>{step.count} <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({step.percent.toFixed(1)}%)</span></span>
                </div>
                
                <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: step.color, 
                    width: `${step.percent}%`,
                    borderRadius: '20px',
                    transition: 'width 0.5s ease-out',
                    boxShadow: `0 0 10px ${step.color}66`
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            A taxa de conversão obedece o período filtrado acima.
          </div>
        </div>
      </div>

      {/* GRÁFICOS INFERIORES: COMPARATIVO E MEMBROS VS VISITANTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        
        {/* GRÁFICO 1: COMPARATIVO GERAL */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>📊 Crescimento Comparativo</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Membros e visitantes mês a mês</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--primary-light)', borderRadius: '3px' }} />
                  <select value={cmpYear1} onChange={e => setCmpYear1(e.target.value)} className="filter-select" style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '0.8rem', padding: '0 4px' }}>
                    <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                  </select>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#95a5a6', borderRadius: '3px' }} />
                  <select value={cmpYear2} onChange={e => setCmpYear2(e.target.value)} className="filter-select" style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '0.8rem', padding: '0 4px' }}>
                    <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', height: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '150px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                <path d={buildSmoothLinePath('year1', maxCmpValue)} fill="none" stroke="var(--primary-light)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={buildSmoothLinePath('year2', maxCmpValue)} fill="none" stroke="#95a5a6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="5,5" />
              </svg>
              
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {comparativeData.map((d, i) => {
                  const isHovered = hoveredMonthIdx === i;
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }} onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)}>
                      {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                    </div>
                  );
                })}
              </div>

              {comparativeData.map((d, i) => {
                const left = `${(i / 11) * 100}%`;
                const top1 = d.year1 !== null ? `${90 - (d.year1 / maxCmpValue) * 80}%` : null;
                const top2 = d.year2 !== null ? `${90 - (d.year2 / maxCmpValue) * 80}%` : null;
                const isHovered = hoveredMonthIdx === i;

                return (
                  <div key={`dots1-${i}`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                    {top1 && <div style={{ position: 'absolute', top: top1, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: 'var(--primary-light)', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px var(--primary-light)' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                    {top2 && <div style={{ position: 'absolute', top: top2, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#95a5a6', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #95a5a6' : 'none', zIndex: 2, transition: 'all 0.2s' }} />}
                    
                    {isHovered && (
                      <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.month}</div>
                        {d.year1 !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--primary-light)', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>{cmpYear1}:</span> <strong>{d.year1}</strong>
                          </div>
                        )}
                        {d.year2 !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#95a5a6', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>{cmpYear2}:</span> <strong>{d.year2}</strong>
                          </div>
                        )}
                        {d.year1 === null && d.year2 === null && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              {comparativeData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{d.month}</div>
              ))}
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: MEMBROS VS VISITANTES */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>👥 Membros vs Visitantes ({cmpYear1})</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Separação por categoria</span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#2ecc71', borderRadius: '3px' }} />
                <span style={{ fontSize: '0.8rem', color: '#fff' }}>Membros</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#f39c12', borderRadius: '3px' }} />
                <span style={{ fontSize: '0.8rem', color: '#fff' }}>Visitantes</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', height: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '150px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                <path d={buildSmoothLinePath('members', maxTypeValues)} fill="none" stroke="#2ecc71" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={buildSmoothLinePath('visitors', maxTypeValues)} fill="none" stroke="#f39c12" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </svg>
              
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {comparativeData.map((d, i) => {
                  const isHovered = hoveredMonthIdx === i;
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }} onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)}>
                      {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                    </div>
                  );
                })}
              </div>

              {comparativeData.map((d, i) => {
                const left = `${(i / 11) * 100}%`;
                const top1 = d.members !== null ? `${90 - (d.members / maxTypeValues) * 80}%` : null;
                const top2 = d.visitors !== null ? `${90 - (d.visitors / maxTypeValues) * 80}%` : null;
                const isHovered = hoveredMonthIdx === i;

                return (
                  <div key={`dots2-${i}`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                    {top1 && <div style={{ position: 'absolute', top: top1, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#2ecc71', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #2ecc71' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                    {top2 && <div style={{ position: 'absolute', top: top2, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#f39c12', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #f39c12' : 'none', zIndex: 2, transition: 'all 0.2s' }} />}
                    
                    {isHovered && (
                      <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.month}</div>
                        {d.members !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#2ecc71', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>Membros:</span> <strong>{d.members}</strong>
                          </div>
                        )}
                        {d.visitors !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#f39c12', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>Visitantes:</span> <strong>{d.visitors}</strong>
                          </div>
                        )}
                        {d.members === null && d.visitors === null && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              {comparativeData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{d.month}</div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
