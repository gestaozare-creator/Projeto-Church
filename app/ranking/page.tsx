"use client";
import { useState, useMemo } from 'react';
import { MOCK_MEMBERS, MOCK_CHURCHES, MOCK_GOALS, Goal } from '../../lib/mock-data';

const VISITORS = [
  { id:'v1', name:'Rafael Moura', churchId: '1', status:'visitante', integrationDate: '2026-05-18' },
  { id:'v2', name:'Bruna Dias', churchId: '2', status:'em_conversao', integrationDate: '2026-05-15' },
  { id:'v3', name:'Lucas Freitas', churchId: '3', status:'visitante', integrationDate: '2026-05-20' },
  { id:'v4', name:'Carla Mendes', churchId: '1', status:'visitante', integrationDate: '2026-05-10' },
  { id:'v5', name:'Pedro Santos', churchId: '2', status:'em_conversao', integrationDate: '2026-05-11' },
];

export default function RankingAlmas() {
  const [year, setYear] = useState('2026');
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [chartChurch, setChartChurch] = useState('ALL'); // Filtro de igreja no gráfico

  // ── Estatísticas ANUAIS por igreja ──
  const churchStats = useMemo(() => {
    const stats: Record<string, { church: any; almas: number; membros: number; visitantes: number; goal: number }> = {};
    MOCK_CHURCHES.forEach(c => {
      const goal = goals.find(g => g.churchId === c.id && g.year.toString() === year)?.target || 0;
      stats[c.id] = { church: c, almas: 0, membros: 0, visitantes: 0, goal };
    });
    MOCK_MEMBERS.forEach(m => {
      if (m.status === 'ativo' && m.integrationDate.startsWith(`${year}-`)) {
        if (stats[m.churchId]) { stats[m.churchId].membros++; stats[m.churchId].almas++; }
      }
    });
    VISITORS.forEach(v => {
      if (v.integrationDate.startsWith(`${year}-`)) {
        if (stats[v.churchId]) { stats[v.churchId].visitantes++; stats[v.churchId].almas++; }
      }
    });
    return Object.values(stats).sort((a, b) => b.almas - a.almas);
  }, [year, goals]);

  // ── Gráfico de Evolução Mensal (filtrável por igreja) ──
  const trendData = useMemo(() => {
    const monthsNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const currentYear = parseInt(year);
    const prevYear = currentYear - 1;
    let maxCount = 0;
    
    // Find the last month that actually has data to prevent drawing flat lines into the future
    let maxMonthWithDataCurr = 0;
    let maxMonthWithDataPrev = 0;

    for (let i = 1; i <= 12; i++) {
      const mStr = i.toString().padStart(2, '0');
      MOCK_MEMBERS.forEach(m => {
        if (m.status === 'ativo') {
          const matchChurch = chartChurch === 'ALL' || m.churchId === chartChurch;
          if (matchChurch && m.integrationDate.startsWith(`${currentYear}-${mStr}`)) maxMonthWithDataCurr = i;
          if (matchChurch && m.integrationDate.startsWith(`${prevYear}-${mStr}`)) maxMonthWithDataPrev = i;
        }
      });
      VISITORS.forEach(v => {
        const matchChurch = chartChurch === 'ALL' || v.churchId === chartChurch;
        if (matchChurch && v.integrationDate.startsWith(`${currentYear}-${mStr}`)) maxMonthWithDataCurr = i;
        if (matchChurch && v.integrationDate.startsWith(`${prevYear}-${mStr}`)) maxMonthWithDataPrev = i;
      });
    }

    const currentYearData: { label: string; count: number; rawMonth: string; cumulative: number | null }[] = [];
    const prevYearData: { count: number; cumulative: number | null }[] = [];
    let cumCurr = 0, cumPrev = 0;

    for (let i = 1; i <= 12; i++) {
      const mStr = i.toString().padStart(2, '0');
      let currCount = 0, prevCount = 0;
      MOCK_MEMBERS.forEach(m => {
        if (m.status === 'ativo') {
          const matchChurch = chartChurch === 'ALL' || m.churchId === chartChurch;
          if (matchChurch && m.integrationDate.startsWith(`${currentYear}-${mStr}`)) currCount++;
          if (matchChurch && m.integrationDate.startsWith(`${prevYear}-${mStr}`)) prevCount++;
        }
      });
      VISITORS.forEach(v => {
        const matchChurch = chartChurch === 'ALL' || v.churchId === chartChurch;
        if (matchChurch && v.integrationDate.startsWith(`${currentYear}-${mStr}`)) currCount++;
        if (matchChurch && v.integrationDate.startsWith(`${prevYear}-${mStr}`)) prevCount++;
      });
      
      cumCurr += currCount; 
      cumPrev += prevCount;
      if (cumCurr > maxCount && i <= maxMonthWithDataCurr) maxCount = cumCurr;
      if (cumPrev > maxCount && i <= maxMonthWithDataPrev) maxCount = cumPrev;
      
      currentYearData.push({ 
        label: monthsNames[i-1], 
        count: currCount, 
        rawMonth: mStr, 
        cumulative: i <= maxMonthWithDataCurr ? cumCurr : null 
      });
      prevYearData.push({ 
        count: prevCount, 
        cumulative: i <= maxMonthWithDataPrev ? cumPrev : null 
      });
    }
    const getX = (index: number) => 4 + index * (92 / 11);
    const getY = (count: number) => maxCount === 0 ? 90 : 90 - (count / maxCount) * 78;
    
    const buildSimplePath = (data: any[], key: string) => {
      const points = data.map((d, i) => d[key] !== null ? { x: getX(i), y: getY(d[key]) } : null).filter(p => p !== null) as {x:number, y:number}[];
      if (points.length === 0) return '';
      return points.map((p, i) => `${i===0?'M':'L'} ${p.x},${p.y}`).join(' ');
    };

    const currPath = buildSimplePath(currentYearData, 'cumulative');
    const prevPath = buildSimplePath(prevYearData, 'cumulative');
    
    // Build area path based on the last valid point
    const lastValidIdx = currentYearData.findLastIndex(d => d.cumulative !== null);
    let areaPath = '';
    if (lastValidIdx >= 0) {
      areaPath = `${currPath} L ${getX(lastValidIdx)} 95 L ${getX(0)} 95 Z`;
    }

    const growthRate = cumPrev > 0 ? Math.round(((cumCurr - cumPrev) / cumPrev) * 100) : (cumCurr > 0 ? 100 : 0);
    return { currentYearData, prevYearData, currPath, prevPath, areaPath, maxCount, currentYear, prevYear, getX, getY, growthRate, totalCurr: cumCurr };
  }, [year, chartChurch]);

  const conversions = useMemo(() => {
    return VISITORS.filter(v => v.integrationDate.startsWith(`${year}-`) && v.status === 'em_conversao').length;
  }, [year]);

  const top3 = churchStats.slice(0, 3);
  const globalTarget = goals.find(g => g.churchId === 'GLOBAL' && g.year.toString() === year)?.target || churchStats.reduce((a, c) => a + c.goal, 0);
  const globalCurrent = churchStats.reduce((a, c) => a + c.almas, 0);
  const globalProgress = globalTarget > 0 ? Math.min((globalCurrent / globalTarget) * 100, 100) : 0;
  const globalColor = globalProgress >= 100 ? '#2ecc71' : globalProgress >= 50 ? '#f1c40f' : '#e74c3c';

  const handleSaveGoal = (churchId: string) => {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.churchId === churchId && g.year.toString() === year);
      if (idx >= 0) { const ng = [...prev]; ng[idx] = { ...ng[idx], target: editValue }; return ng; }
      return [...prev, { id: 'g_'+Date.now(), churchId, year: parseInt(year), target: editValue }];
    });
    setEditingGoal(null);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:'14px', paddingBottom:'20px', background: 'radial-gradient(circle at center, #131422 0%, #0a0a14 100%)', position: 'relative' }}>
      {/* Background Grid Style Gamer */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display:'flex', flexDirection:'column', height:'100%', gap:'14px' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h3 style={{ fontSize:'1.3rem', margin:0 }}>🏆 Ranking de Almas &amp; Metas</h3>
          <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>Acompanhamento anual de crescimento por congregação</span>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:'600' }}>Ano:</span>
          <select value={year} onChange={e => setYear(e.target.value)} className="search-input glass-input" style={{ padding:'6px 12px' }}>
            <option value="2025">2025</option><option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* ═══════ LAYOUT ═══════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'14px', flex:1, overflow:'hidden' }}>

        {/* ══ COLUNA ESQUERDA ══ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px', overflowY:'auto', paddingRight:'4px' }}>

          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px' }}>
            {/* Meta Global Anual */}
            <div className="glass" style={{ padding:'18px 20px', borderRadius:'14px', display:'flex', alignItems:'center', gap:'16px', border:'1px solid rgba(46,204,113,0.15)', background:'linear-gradient(135deg, rgba(46,204,113,0.05) 0%, transparent 100%)' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:`conic-gradient(${globalColor} ${globalProgress}%, rgba(255,255,255,0.06) 0)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:'var(--card-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:'1rem', fontWeight:'800', color:globalColor }}>{Math.round(globalProgress)}%</span>
                </div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:'700', letterSpacing:'0.5px' }}>Meta Anual</span>
                  {editingGoal === 'GLOBAL' ? (
                    <div style={{ display:'flex', gap:'4px' }}>
                      <input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))} style={{ width:'60px', padding:'4px 6px', fontSize:'0.8rem', borderRadius:'6px', border:'none', background:'rgba(255,255,255,0.1)', color:'#fff' }} autoFocus />
                      <button onClick={() => handleSaveGoal('GLOBAL')} style={{ padding:'4px 8px', background:'#2ecc71', border:'none', borderRadius:'6px', color:'#fff', cursor:'pointer', fontSize:'0.7rem' }}>💾</button>
                    </div>
                  ) : (
                    <span style={{ cursor:'pointer', opacity:0.4, fontSize:'0.75rem' }} onClick={() => { setEditingGoal('GLOBAL'); setEditValue(globalTarget); }}>✏️</span>
                  )}
                </div>
                <div style={{ fontSize:'1.6rem', fontWeight:'900', lineHeight:1.1, color:'#fff' }}>{globalCurrent} <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'var(--text-secondary)' }}>/ {globalTarget}</span></div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'4px' }}>Almas · {year}</div>
              </div>
            </div>
            {/* Total Almas */}
            <div className="glass" style={{ padding:'18px 20px', borderRadius:'14px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:'700', marginBottom:'6px', letterSpacing:'0.5px' }}>Total de Almas</div>
              <div style={{ fontSize:'2.2rem', fontWeight:'900', lineHeight:1, color:'var(--primary-light)' }}>{globalCurrent}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'8px', display:'flex', gap:'8px' }}>
                <span>🔵 {churchStats.reduce((a,c) => a+c.membros, 0)} membros</span>
                <span>🟡 {churchStats.reduce((a,c) => a+c.visitantes, 0)} visit.</span>
              </div>
            </div>
            {/* Crescimento */}
            <div className="glass" style={{ padding:'18px 20px', borderRadius:'14px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:'700', marginBottom:'6px', letterSpacing:'0.5px' }}>Crescimento</div>
              <div style={{ fontSize:'2.2rem', fontWeight:'900', lineHeight:1, color: trendData.growthRate >= 0 ? '#2ecc71' : '#e74c3c' }}>
                {trendData.growthRate >= 0 ? '+' : ''}{trendData.growthRate}%
              </div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'8px' }}>vs {trendData.prevYear}</div>
            </div>
            {/* Conversões */}
            <div className="glass" style={{ padding:'18px 20px', borderRadius:'14px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:'700', marginBottom:'6px', letterSpacing:'0.5px' }}>Conversões</div>
              <div style={{ fontSize:'2.2rem', fontWeight:'900', lineHeight:1, color:'#f39c12' }}>{conversions}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', marginTop:'8px' }}>Visitante → Membro</div>
            </div>
          </div>

          {/* GRÁFICO DE EVOLUÇÃO MENSAL (ACUMULADO) */}
          <div className="glass" style={{ padding:'16px 18px', borderRadius:'14px', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
              <h4 style={{ fontSize:'0.85rem', color:'var(--text-secondary)', margin:0 }}>📈 Evolução Mensal (Acumulado)</h4>
              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                {/* Seletor de Igreja */}
                <select value={chartChurch} onChange={e => setChartChurch(e.target.value)} className="search-input glass-input" style={{ padding:'4px 8px', fontSize:'0.65rem' }}>
                  <option value="ALL">Todas as Igrejas</option>
                  {MOCK_CHURCHES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {/* Legenda */}
                <div style={{ display:'flex', gap:'10px', fontSize:'0.55rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'3px' }}><div style={{ width:'12px', height:'3px', background:'#3b82f6', borderRadius:'2px' }}/> {trendData.currentYear}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'3px' }}><div style={{ width:'12px', height:'3px', background:'rgba(255,255,255,0.3)', borderRadius:'2px' }}/> {trendData.prevYear}</div>
                </div>
              </div>
            </div>

            {/* Meta line label */}
            {chartChurch !== 'ALL' && (() => {
              const cGoal = goals.find(g => g.churchId === chartChurch && g.year.toString() === year)?.target;
              return cGoal ? <div style={{ fontSize:'0.6rem', color:'rgba(46,204,113,0.7)', marginBottom:'4px' }}>── Meta anual: {cGoal} almas</div> : null;
            })()}

            <div style={{ width:'100%', position:'relative', height:'160px' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', top:0, left:0, overflow:'visible' }}>
                {[25,50,75].map(y => <line key={y} x1="4" y1={y} x2="96" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />)}
                <line x1="4" y1="90" x2="96" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                {/* Linha da Meta Anual (horizontal tracejada verde) */}
                {(() => {
                  const targetVal = chartChurch === 'ALL' ? globalTarget : (goals.find(g => g.churchId === chartChurch && g.year.toString() === year)?.target || 0);
                  if (targetVal > 0 && trendData.maxCount > 0) {
                    const yPos = 90 - (targetVal / trendData.maxCount) * 78;
                    if (yPos > 5 && yPos < 95) {
                      return <line x1="4" y1={yPos} x2="96" y2={yPos} stroke="rgba(46,204,113,0.4)" strokeWidth="1" strokeDasharray="3,2" vectorEffect="non-scaling-stroke" />;
                    }
                  }
                  return null;
                })()}

                <path d={trendData.areaPath} fill="url(#gradBlueArea)" opacity="0.15" />
                <defs><linearGradient id="gradBlueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00f2fe" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                <path d={trendData.prevPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4,3" vectorEffect="non-scaling-stroke" />
                <path d={trendData.currPath} fill="none" stroke="#00f2fe" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(0,242,254,0.6))' }} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </svg>

              {trendData.currentYearData.map((d, i) => {
                const hasDot = d.count > 0 && d.cumulative !== null;
                const dotTop = d.cumulative !== null ? `${trendData.getY(d.cumulative)}%` : null;
                return (
                  <div key={`col-${i}`}
                    title={`${d.label} ${trendData.currentYear}: ${d.count > 0 ? `+${d.count} no mês` : '0'} (${d.cumulative !== null ? d.cumulative : '-'} acum.)\n${d.label} ${trendData.prevYear}: +${trendData.prevYearData[i].count} (${trendData.prevYearData[i].cumulative !== null ? trendData.prevYearData[i].cumulative : '-'} acum.)`}
                    style={{ position:'absolute', left:`${trendData.getX(i)}%`, transform:'translateX(-50%)', height:'100%', width:'8%', cursor:'pointer', zIndex:10, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center' }}>
                    
                    {/* Render standard HTML dot instead of distorted SVG circle */}
                    {dotTop && (
                      <div style={{ position:'absolute', top: dotTop, left: '50%', transform: 'translate(-50%, -50%)', width: hasDot ? '10px' : '6px', height: hasDot ? '10px' : '6px', background: hasDot ? '#fff' : '#00f2fe', border: `2px solid ${hasDot ? '#00f2fe' : 'transparent'}`, borderRadius: '50%', boxShadow: hasDot ? '0 0 8px rgba(0,242,254,0.8)' : 'none', zIndex: 11, pointerEvents: 'none' }} />
                    )}

                    {d.count > 0 && d.cumulative !== null && <div style={{ position:'absolute', top:`${trendData.getY(d.cumulative)}%`, transform:'translateY(-100%)', marginTop:'-12px', background:'rgba(0,242,254,0.15)', border: '1px solid #00f2fe', color:'#fff', padding:'2px 6px', borderRadius:'6px', fontSize:'0.55rem', fontWeight:'bold', boxShadow:'0 0 10px rgba(0,242,254,0.5)', pointerEvents:'none', whiteSpace:'nowrap' }}>{d.cumulative}</div>}
                    <span style={{ fontSize:'0.5rem', color: d.count > 0 ? '#00f2fe' : 'var(--text-secondary)', fontWeight: d.count > 0 ? '800' : '500', marginBottom:'-2px', textShadow: d.count > 0 ? '0 0 5px rgba(0,242,254,0.8)' : 'none' }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* METAS ANUAIS POR IGREJA */}
          <div className="glass" style={{ padding:'16px', borderRadius:'14px' }}>
            <h4 style={{ fontSize:'0.85rem', marginBottom:'12px' }}>🎯 Metas Anuais por Igreja — {year}</h4>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
              {churchStats.map((stats, idx) => {
                const p = stats.goal > 0 ? (stats.almas / stats.goal) * 100 : 0;
                const color = p >= 100 ? '#2ecc71' : p >= 50 ? '#f1c40f' : '#e74c3c';
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                return (
                  <div key={stats.church.id} style={{ display:'flex', flexDirection:'column', gap:'5px', padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        {medal && <span style={{ fontSize:'0.8rem' }}>{medal}</span>}
                        <span style={{ fontSize:'0.78rem', fontWeight:'600' }}>{stats.church.name}</span>
                      </div>
                      {editingGoal === stats.church.id ? (
                        <div style={{ display:'flex', gap:'3px' }}>
                          <input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))} style={{ width:'50px', padding:'2px 4px', fontSize:'0.65rem', borderRadius:'4px', border:'none', background:'rgba(255,255,255,0.1)', color:'#fff' }} autoFocus />
                          <button onClick={() => handleSaveGoal(stats.church.id)} style={{ padding:'2px 6px', background:'#2ecc71', border:'none', borderRadius:'4px', color:'#fff', cursor:'pointer', fontSize:'0.6rem', fontWeight:'600' }}>💾</button>
                          <button onClick={() => setEditingGoal(null)} style={{ padding:'2px 5px', background:'#e74c3c', border:'none', borderRadius:'4px', color:'#fff', cursor:'pointer', fontSize:'0.6rem' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }} onClick={() => { setEditingGoal(stats.church.id); setEditValue(stats.goal); }}>
                          Meta: <strong style={{ color:'#fff' }}>{stats.goal}</strong> <span style={{ opacity:0.4 }}>✏️</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ flex:1, height:'8px', background:'rgba(255,255,255,0.05)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ width: `${Math.min(p, 100)}%`, height:'100%', background:`linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius:'4px', transition:'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize:'0.7rem', fontWeight:'700', minWidth:'40px', textAlign:'right', color }}>{stats.almas}/{stats.goal}</div>
                      <div style={{ fontSize:'0.6rem', fontWeight:'700', minWidth:'30px', textAlign:'right', color }}>{Math.round(p)}%</div>
                    </div>
                    <div style={{ display:'flex', gap:'8px', fontSize:'0.55rem', color:'var(--text-secondary)' }}>
                      <span>🔵 {stats.membros} membros</span>
                      <span>🟡 {stats.visitantes} visitantes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ COLUNA DIREITA: RANKING ══ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto' }}>
          {/* PÓDIO GAMER */}
          <div className="glass" style={{ padding:'30px 14px 10px', display:'flex', alignItems:'flex-end', justifyContent:'center', gap:'12px', minHeight:'250px', borderRadius:'14px', position: 'relative', overflow: 'hidden', background: 'rgba(20,20,35,0.6)', border: '1px solid rgba(0,242,254,0.1)' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at 50% 100%, rgba(0,242,254,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
            
            {top3[1] && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'30%', animation:'slideUp 0.6s ease', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize:'2.2rem', marginBottom:'-14px', zIndex:2, filter: 'drop-shadow(0 0 10px rgba(189,195,199,0.8))' }}>🥈</div>
                <div style={{ padding:'10px 8px', background:'linear-gradient(180deg, rgba(189,195,199,0.15) 0%, rgba(189,195,199,0.05) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(189,195,199,0.3)', borderBottom: 'none', width:'100%', height:'110px', borderRadius:'12px 12px 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', color:'#fff', boxShadow:'inset 0 4px 20px rgba(189,195,199,0.1), 0 -4px 15px rgba(189,195,199,0.2)' }}>
                  <span style={{ fontWeight:'900', fontSize:'1.2rem', marginTop:'8px', color: '#bdc3c7', textShadow: '0 0 8px rgba(189,195,199,0.5)' }}>{top3[1].almas}</span>
                  <span style={{ fontSize:'0.55rem', fontWeight:'800', textTransform:'uppercase', color: '#bdc3c7', letterSpacing: '1px' }}>Almas</span>
                  <span style={{ fontSize:'0.6rem', fontWeight:'600', marginTop:'auto', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>{top3[1].church.name}</span>
                </div>
              </div>
            )}
            {top3[0] && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'36%', animation:'slideUp 0.4s ease', position: 'relative', zIndex: 3 }}>
                <div style={{ fontSize:'3rem', marginBottom:'-16px', zIndex:2, filter:'drop-shadow(0 0 15px rgba(241,196,15,1))' }}>🥇</div>
                <div style={{ padding:'12px 8px', background:'linear-gradient(180deg, rgba(241,196,15,0.2) 0%, rgba(241,196,15,0.05) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(241,196,15,0.5)', borderBottom: 'none', width:'100%', height:'150px', borderRadius:'12px 12px 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', color:'#fff', boxShadow:'inset 0 4px 30px rgba(241,196,15,0.2), 0 -4px 25px rgba(241,196,15,0.3)' }}>
                  <span style={{ fontWeight:'900', fontSize:'1.6rem', marginTop:'10px', color: '#f1c40f', textShadow: '0 0 12px rgba(241,196,15,0.8)' }}>{top3[0].almas}</span>
                  <span style={{ fontSize:'0.6rem', fontWeight:'800', textTransform:'uppercase', color: '#f1c40f', letterSpacing: '1px' }}>Almas</span>
                  <div style={{ marginTop:'8px', background:'rgba(241,196,15,0.15)', border: '1px solid rgba(241,196,15,0.3)', padding:'3px 8px', borderRadius:'10px', fontSize:'0.55rem', fontWeight:'800', color: '#f1c40f', boxShadow: '0 0 10px rgba(241,196,15,0.2)' }}>
                    {top3[0].goal > 0 ? `${Math.round((top3[0].almas/top3[0].goal)*100)}% da Meta` : 'Sem Meta'}
                  </div>
                  <span style={{ fontSize:'0.65rem', fontWeight:'800', marginTop:'auto', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>{top3[0].church.name}</span>
                </div>
              </div>
            )}
            {top3[2] && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'30%', animation:'slideUp 0.8s ease', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize:'1.8rem', marginBottom:'-12px', zIndex:2, filter: 'drop-shadow(0 0 10px rgba(230,126,34,0.8))' }}>🥉</div>
                <div style={{ padding:'10px 8px', background:'linear-gradient(180deg, rgba(230,126,34,0.15) 0%, rgba(230,126,34,0.05) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(230,126,34,0.3)', borderBottom: 'none', width:'100%', height:'85px', borderRadius:'12px 12px 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', color:'#fff', boxShadow:'inset 0 4px 20px rgba(230,126,34,0.1), 0 -4px 15px rgba(230,126,34,0.2)' }}>
                  <span style={{ fontWeight:'900', fontSize:'1.1rem', marginTop:'6px', color: '#e67e22', textShadow: '0 0 8px rgba(230,126,34,0.5)' }}>{top3[2].almas}</span>
                  <span style={{ fontSize:'0.55rem', fontWeight:'800', textTransform:'uppercase', color: '#e67e22', letterSpacing: '1px' }}>Almas</span>
                  <span style={{ fontSize:'0.6rem', fontWeight:'600', marginTop:'auto', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>{top3[2].church.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* LISTA CLASSIFICAÇÃO */}
          <div className="glass" style={{ padding:'14px', display:'flex', flexDirection:'column', gap:'6px', borderRadius:'14px', flex:1 }}>
            <h4 style={{ fontSize:'0.8rem', marginBottom:'2px', color:'var(--text-secondary)' }}>📋 Classificação {year}</h4>
            {churchStats.map((stats, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
              const p = stats.goal > 0 ? Math.round((stats.almas / stats.goal) * 100) : 0;
              const pColor = p >= 100 ? '#2ecc71' : p >= 50 ? '#f1c40f' : '#e74c3c';
              return (
                <div key={stats.church.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', background: i < 3 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
                  onClick={() => setChartChurch(stats.church.id === chartChurch ? 'ALL' : stats.church.id)}>
                  <div style={{ width:'22px', textAlign:'center', fontSize:'0.75rem', fontWeight:'700', color:'var(--text-secondary)' }}>{medal || `${i+1}º`}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:'600', fontSize:'0.78rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: stats.church.id === chartChurch ? '#3b82f6' : 'inherit' }}>{stats.church.name}</div>
                    <div style={{ fontSize:'0.55rem', color:'var(--text-secondary)', display:'flex', gap:'6px' }}>
                      <span>🔵 {stats.membros}</span><span>🟡 {stats.visitantes}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'1rem', fontWeight:'700', color:'var(--primary-light)' }}>{stats.almas}</div>
                    {stats.goal > 0 && <div style={{ fontSize:'0.5rem', fontWeight:'600', color:pColor }}>{p}% meta</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
