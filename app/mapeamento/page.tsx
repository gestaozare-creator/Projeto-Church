"use client";
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BRAZIL_STATES } from '@/lib/brazil-map-data';
import { Member, Church } from '@/types/database';

type Person = { id: string; name: string; phone?: string; address?: string; state?: string; type: 'membro' | 'visitante'; photoUrl?: string; function?: string; ministry?: string; status?: string };


export default function Mapeamento() {
  const [dbMembers, setDbMembers] = useState<Member[]>([]);
  const [dbChurches, setDbChurches] = useState<Church[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: membersData } = await supabase.from('members').select('*');
      if (membersData) setDbMembers(membersData);

      const { data: churchesData } = await supabase.from('churches').select('*');
      if (churchesData) setDbChurches(churchesData);
    }
    fetchData();
  }, []);

  const [selectedState, setSelectedState] = useState<string|null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person|null>(null);
  const [filter, setFilter] = useState<'todos'|'membro'|'visitante'>('todos');
  const [hover, setHover] = useState<string|null>(null);
  const [detailTab, setDetailTab] = useState<'pessoas'|'cidades'|'bairros'>('pessoas');

  // Unificar membros ativos + visitantes
  const allPeople: Person[] = useMemo(() => {
    const members = dbMembers.map(m => ({
      id: m.id, name: m.name, phone: m.phone, address: m.address, state: m.state,
      type: (m.status === 'visitante' ? 'visitante' : 'membro') as 'visitante' | 'membro', photoUrl: m.photoUrl, function: m.function, ministry: m.ministry, status: m.status
    }));
    return members;
  }, [dbMembers]);

  const filteredPeople = useMemo(() => {
    if (filter === 'todos') return allPeople;
    return allPeople.filter(p => p.type === filter);
  }, [allPeople, filter]);

  // Contagem por estado
  const stateCounts = useMemo(() => {
    const counts: Record<string, { total:number; membros:number; visitantes:number }> = {};
    filteredPeople.forEach(p => {
      const stateStr = p.state || 'N/A';
      if (!counts[stateStr]) counts[stateStr] = { total:0, membros:0, visitantes:0 };
      counts[stateStr].total++;
      if (p.type === 'membro') counts[stateStr].membros++;
      else counts[stateStr].visitantes++;
    });
    return counts;
  }, [filteredPeople]);

  const maxCount = Math.max(...Object.values(stateCounts).map(c => c.total), 1);

  const getStateColor = (uf: string) => {
    const c = stateCounts[uf];
    if (!c) return 'var(--table-border)';
    const intensity = c.total / maxCount;
    return `hsla(217, 80%, ${25 + (1-intensity)*35}%, ${0.5 + intensity*0.5})`;
  };

  const statePeople = useMemo(() => {
    if (!selectedState) return [];
    return filteredPeople.filter(p => p.state === selectedState);
  }, [filteredPeople, selectedState]);

  const { cityCounts, neighborhoodCounts } = useMemo(() => {
    const cCounts: Record<string, number> = {};
    const nCounts: Record<string, number> = {};
    
    statePeople.forEach(p => {
      const parts = (p.address || '').split(',').map(s => s.trim());
      const neighborhood = parts[0] || 'Desconhecido';
      const city = parts[1] || 'Desconhecida';
      
      nCounts[neighborhood] = (nCounts[neighborhood] || 0) + 1;
      cCounts[city] = (cCounts[city] || 0) + 1;
    });
    
    return {
      cityCounts: Object.entries(cCounts).sort((a,b) => b[1] - a[1]),
      neighborhoodCounts: Object.entries(nCounts).sort((a,b) => b[1] - a[1]),
    };
  }, [statePeople]);

  const topStates = useMemo(() => {
    return Object.entries(stateCounts).sort((a,b) => b[1].total - a[1].total).slice(0, 8);
  }, [stateCounts]);

  const totalMembros = allPeople.filter(p => p.type === 'membro').length;
  const totalVisitantes = allPeople.filter(p => p.type === 'visitante').length;

  // ====== NÍVEL 2: DETALHE DO ESTADO ======
  if (selectedState) {
    const stName = BRAZIL_STATES[selectedState]?.name || selectedState;
    const mapQ = selectedPerson ? selectedPerson.address : `${stName}, Brasil`;
    const mapZ = selectedPerson ? 12 : 8; // Zoom levemente menor para caber a rota
    
    // Configuração do mapa com rota quando tem uma pessoa selecionada
    const defaultChurchAddress = dbChurches[0]?.address || 'Centro, São Paulo, SP';
    const mapUrl = selectedPerson
      ? `https://maps.google.com/maps?saddr=${encodeURIComponent(defaultChurchAddress)}&daddr=${encodeURIComponent(selectedPerson.address || '')}&t=&z=${mapZ}&ie=UTF8&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(mapQ || '')}&t=&z=${mapZ}&ie=UTF8&iwloc=B&output=embed`;

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={() => { setSelectedState(null); setSelectedPerson(null); }} style={{ padding:'7px 14px', borderRadius:'8px', border:'1px solid var(--card-border)', background:'transparent', color:'var(--primary-light)', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>← Brasil</button>
          <h3 style={{ fontSize:'1.2rem' }}>📍 {stName}</h3>
          <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{statePeople.length} pessoa{statePeople.length!==1?'s':''}</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:'4px' }}>
            {(['todos','membro','visitante'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 10px', borderRadius:'6px', fontSize:'0.72rem', fontWeight:'600', cursor:'pointer', border:'none',
                background: filter===f ? (f==='membro'?'#3b82f6':f==='visitante'?'#f39c12':'var(--primary-color)') : 'rgba(255,255,255,0.05)',
                color: filter===f ? '#fff' : 'var(--text-secondary)' }}>
                {f==='todos'?'Todos':f==='membro'?'🔵 Membros':'🟡 Visitantes'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'250px 1fr 280px', gap:'12px', flex:1, overflow:'hidden' }}>
          {/* Lista e Divisões */}
          <div className="glass" style={{ display:'flex', flexDirection:'column', padding:'12px', overflow:'hidden' }}>
            <div style={{ display:'flex', gap:'4px', marginBottom:'10px' }}>
              <button onClick={() => setDetailTab('pessoas')} style={{ flex:1, padding:'6px', fontSize:'0.75rem', borderRadius:'6px', border:'none', cursor:'pointer', background: detailTab==='pessoas'?'var(--primary-color)':'rgba(255,255,255,0.05)', color: detailTab==='pessoas'?'#fff':'var(--text-secondary)' }}>Pessoas</button>
              <button onClick={() => setDetailTab('cidades')} style={{ flex:1, padding:'6px', fontSize:'0.75rem', borderRadius:'6px', border:'none', cursor:'pointer', background: detailTab==='cidades'?'var(--primary-color)':'rgba(255,255,255,0.05)', color: detailTab==='cidades'?'#fff':'var(--text-secondary)' }}>Cidades</button>
              <button onClick={() => setDetailTab('bairros')} style={{ flex:1, padding:'6px', fontSize:'0.75rem', borderRadius:'6px', border:'none', cursor:'pointer', background: detailTab==='bairros'?'var(--primary-color)':'rgba(255,255,255,0.05)', color: detailTab==='bairros'?'#fff':'var(--text-secondary)' }}>Bairros</button>
            </div>
            <div className="scroll-container" style={{ flex:1 }}>
              {detailTab === 'pessoas' && (
                <>
                  {statePeople.map(p => (
                    <div key={p.id} className={`glass member-card ${selectedPerson?.id===p.id?'card-selected':''}`}
                      style={{ padding:'8px 10px', flexDirection:'row', alignItems:'center', gap:'8px', marginBottom:'5px', cursor:'pointer' }}
                      onClick={() => setSelectedPerson(p)}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: p.type==='membro'?'linear-gradient(135deg,#3b82f6,#2563eb)':'linear-gradient(135deg,#f39c12,#e67e22)',
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'0.65rem', flexShrink:0 }}>
                        {p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:'600', fontSize:'0.78rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)' }}>{p.address}</div>
                      </div>
                      <span style={{ fontSize:'0.5rem', padding:'2px 5px', borderRadius:'4px', fontWeight:'700',
                        background: p.type==='membro'?'rgba(59,130,246,0.15)':'rgba(243,156,18,0.15)',
                        color: p.type==='membro'?'#3b82f6':'#f39c12',
                        border: `1px solid ${p.type==='membro'?'rgba(59,130,246,0.3)':'rgba(243,156,18,0.3)'}` }}>
                        {p.type==='membro'?'MEMBRO':'VISITANTE'}
                      </span>
                    </div>
                  ))}
                  {statePeople.length===0 && <div style={{ textAlign:'center', padding:'30px', color:'var(--text-secondary)', fontSize:'0.82rem' }}>Nenhuma pessoa neste estado</div>}
                </>
              )}
              
              {detailTab === 'cidades' && (
                <>
                  {cityCounts.map(([city, count]) => (
                    <div key={city} className="glass" style={{ padding:'8px 10px', display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'0.78rem', fontWeight:'600' }}>{city}</span>
                      <span style={{ fontSize:'0.75rem', color:'var(--primary-light)', fontWeight:'700' }}>{count}</span>
                    </div>
                  ))}
                </>
              )}

              {detailTab === 'bairros' && (
                <>
                  {neighborhoodCounts.map(([neighborhood, count]) => (
                    <div key={neighborhood} className="glass" style={{ padding:'8px 10px', display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'0.78rem', fontWeight:'600' }}>{neighborhood}</span>
                      <span style={{ fontSize:'0.75rem', color:'var(--primary-light)', fontWeight:'700' }}>{count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Mapa Google */}
          <div style={{ borderRadius:'14px', overflow:'hidden', border:'1px solid var(--card-border)', position:'relative' }}>
            <div style={{ position:'absolute', top:'12px', left:'12px', zIndex:10, background:'var(--primary-color)', color:'#fff', padding:'5px 12px', borderRadius:'16px', fontSize:'0.72rem', fontWeight:'bold', boxShadow:'0 3px 8px rgba(0,0,0,0.3)', maxWidth:'70%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {selectedPerson ? `🗺️ Rota: Igreja ➔ ${selectedPerson.name}` : `📍 ${stName}`}
            </div>
            <iframe width="100%" height="100%" frameBorder="0" style={{ border:0 }}
              src={mapUrl}
              allowFullScreen />
          </div>

          {/* Detalhes */}
          <div className="glass" style={{ display:'flex', flexDirection:'column', padding:'14px', overflow:'auto' }}>
            {selectedPerson ? (
              <div style={{ animation:'fadeIn 0.3s ease' }}>
                <div style={{ textAlign:'center', marginBottom:'12px' }}>
                  <div style={{ width:'65px', height:'65px', borderRadius:'50%', margin:'0 auto 8px',
                    background: selectedPerson.type==='membro'?'linear-gradient(135deg,#3b82f6,#2563eb)':'linear-gradient(135deg,#f39c12,#e67e22)',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'1.3rem',
                    boxShadow: `0 4px 15px ${selectedPerson.type==='membro'?'rgba(59,130,246,0.4)':'rgba(243,156,18,0.4)'}` }}>
                    {selectedPerson.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <h3 style={{ fontSize:'0.92rem', marginBottom:'4px' }}>{selectedPerson.name}</h3>
                  <span style={{ fontSize:'0.6rem', padding:'3px 8px', borderRadius:'6px', fontWeight:'700',
                    background: selectedPerson.type==='membro'?'rgba(59,130,246,0.15)':'rgba(243,156,18,0.15)',
                    color: selectedPerson.type==='membro'?'#3b82f6':'#f39c12' }}>
                    {selectedPerson.type==='membro'?'🔵 Membro Efetivo':'🟡 Visitante (Potencial)'}
                  </span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  <IC label="Contato" value={`📞 ${selectedPerson.phone}`} />
                  <IC label="Endereço" value={`📍 ${selectedPerson.address}`} />
                  {selectedPerson.function && selectedPerson.function !== 'Ainda não definida' && <IC label="Função" value={selectedPerson.function} />}
                  {selectedPerson.ministry && <IC label="Ministério" value={selectedPerson.ministry} />}
                </div>
                <button className="modal-btn" style={{ margin:'10px 0 0', width:'100%', padding:'8px', fontSize:'0.78rem', backgroundColor:'#25d366' }}
                  onClick={() => window.open(`https://wa.me/55${(selectedPerson.phone || '').replace(/\D/g,'')}`, '_blank')}>💬 WhatsApp</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'6px' }}>
                <div style={{ fontSize:'2rem', opacity:0.3 }}>👤</div>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.78rem', textAlign:'center' }}>Selecione uma pessoa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====== NÍVEL 1: MAPA DO BRASIL ======
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <h3 style={{ fontSize:'1.3rem' }}>🗺️ Mapeamento Geográfico</h3>
        <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>Distribuição de membros e visitantes no Brasil</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'12px', flex:1, overflow:'hidden' }}>
        {/* MAPA SVG */}
        <div className="glass" style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
          {/* Filtros sobre o mapa */}
          <div style={{ position:'absolute', top:'15px', left:'15px', display:'flex', gap:'4px', zIndex:5 }}>
            {(['todos','membro','visitante'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:'600', cursor:'pointer', border:'none',
                background: filter===f ? (f==='membro'?'#3b82f6':f==='visitante'?'#f39c12':'var(--primary-color)') : 'rgba(255,255,255,0.08)',
                color: filter===f ? '#fff' : 'var(--text-secondary)', transition:'all 0.2s' }}>
                {f==='todos'?`Todos (${totalMembros+totalVisitantes})`:f==='membro'?`🔵 Membros (${totalMembros})`:`🟡 Visitantes (${totalVisitantes})`}
              </button>
            ))}
          </div>

          {/* Legenda */}
          <div style={{ position:'absolute', bottom:'15px', left:'15px', display:'flex', gap:'12px', fontSize:'0.7rem', color:'var(--text-secondary)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#3b82f6' }} />Membro (efetivo)</div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#f39c12' }} />Visitante (potencial)</div>
          </div>

          <svg viewBox="20 140 560 580" style={{ width:'100%', maxHeight:'100%', maxWidth:'550px' }}>
            {Object.entries(BRAZIL_STATES).map(([uf, data]) => {
              const count = stateCounts[uf];
              const isHover = hover === uf;
              return (
                <g key={uf} onClick={() => { setSelectedState(uf); setSelectedPerson(null); }} onMouseEnter={() => setHover(uf)} onMouseLeave={() => setHover(null)} style={{ cursor: count ? 'pointer' : 'default' }}>
                  <path d={data.path} fill={getStateColor(uf)} stroke="var(--text-primary)" strokeOpacity={0.15} strokeWidth={isHover ? 2 : 0.8}
                    style={{ transition:'all 0.2s', filter: isHover ? 'brightness(1.2)' : 'none' }} />
                  <text x={data.labelX} y={data.labelY-6} textAnchor="middle" fill="var(--text-primary)" opacity="0.5" fontSize="8" fontWeight="600" style={{ pointerEvents:'none' }}>{uf}</text>
                  {count && (
                    <g style={{ pointerEvents:'none' }}>
                      <circle cx={data.labelX} cy={data.labelY+6} r={10 + Math.min(count.total * 2, 8)} fill="var(--primary-color)" opacity="0.9" />
                      <text x={data.labelX} y={data.labelY+10} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{count.total}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hover && stateCounts[hover] && (
            <div style={{ position:'absolute', top:'15px', right:'15px', padding:'10px 14px', borderRadius:'10px', background:'var(--card-bg)', border:'1px solid var(--card-border)', backdropFilter:'blur(10px)', fontSize:'0.82rem', zIndex:10, animation:'fadeIn 0.15s ease' }}>
              <div style={{ fontWeight:'700', marginBottom:'4px' }}>{BRAZIL_STATES[hover]?.name}</div>
              <div style={{ display:'flex', gap:'10px', fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                <span>🔵 {stateCounts[hover].membros} membros</span>
                <span>🟡 {stateCounts[hover].visitantes} visitantes</span>
              </div>
            </div>
          )}
        </div>

        {/* PAINEL LATERAL */}
        <div className="glass" style={{ display:'flex', flexDirection:'column', padding:'16px', overflow:'auto', gap:'12px' }}>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            <div className="glass" style={{ padding:'10px', textAlign:'center', borderRadius:'10px' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'#3b82f6' }}>{totalMembros}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)' }}>Membros</div>
            </div>
            <div className="glass" style={{ padding:'10px', textAlign:'center', borderRadius:'10px' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'#f39c12' }}>{totalVisitantes}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)' }}>Visitantes</div>
            </div>
          </div>
          <div className="glass" style={{ padding:'10px', textAlign:'center', borderRadius:'10px' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'var(--primary-light)' }}>{Object.keys(stateCounts).length}</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)' }}>Estados com presença</div>
          </div>

          {/* Ranking */}
          <div>
            <h4 style={{ fontSize:'0.82rem', marginBottom:'8px', color:'var(--primary-light)' }}>🏆 Ranking por Estado</h4>
            {topStates.map(([uf, data], i) => (
              <div key={uf} className="glass" style={{ padding:'8px 10px', marginBottom:'4px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}
                onClick={() => { setSelectedState(uf); setSelectedPerson(null); }}>
                <span style={{ fontSize:'0.75rem', fontWeight:'700', color: i<3 ? '#f39c12' : 'var(--text-secondary)', width:'18px' }}>#{i+1}</span>
                <span style={{ flex:1, fontSize:'0.78rem', fontWeight:'600' }}>{BRAZIL_STATES[uf]?.name}</span>
                <div style={{ display:'flex', gap:'6px', fontSize:'0.65rem' }}>
                  <span style={{ color:'#3b82f6' }}>🔵{data.membros}</span>
                  <span style={{ color:'#f39c12' }}>🟡{data.visitantes}</span>
                </div>
                <span style={{ fontSize:'0.82rem', fontWeight:'700', color:'var(--primary-light)' }}>{data.total}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textAlign:'center', marginTop:'auto', padding:'8px', opacity:0.6 }}>
            Clique em um estado para ver detalhes
          </div>
        </div>
      </div>
    </div>
  );
}

function IC({ label, value }: { label:string; value:string }) {
  return (
    <div className="glass" style={{ padding:'7px 9px', borderRadius:'7px' }}>
      <div style={{ fontSize:'0.58rem', color:'var(--text-secondary)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>{label}</div>
      <div style={{ color:'var(--text-primary)', fontWeight:'500', fontSize:'0.72rem', whiteSpace:'pre-line' }}>{value}</div>
    </div>
  );
}
