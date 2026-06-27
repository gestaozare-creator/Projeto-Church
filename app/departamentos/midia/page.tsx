"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';



const MIDIA_ROLES = ['Som', 'Transmissão', 'Projeção', 'Iluminação', 'Fotografia'];

export default function MidiaDashboardPage() {
  const { currentUser } = useAuth();
  const [selectedMonthStr, setSelectedMonthStr] = useState(new Date().toISOString().slice(0, 7)); 
  
  const getCultosDoMes = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    const dates = [];
    while (date.getMonth() === m - 1) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 3) {
        dates.push(date.toISOString().split('T')[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const [timelineDates, setTimelineDates] = useState<string[]>(getCultosDoMes(selectedMonthStr));
  const [activeDate, setActiveDate] = useState<string>(timelineDates[0] || new Date().toISOString().split('T')[0]);
  const [escalasGlobais, setEscalasGlobais] = useState<Record<string, Record<string, string[]>>>({});
  const [dbMembers, setDbMembers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: membersDb } = await supabase
        .from('members')
        .select('id, name, function, status')
        .eq('ministry', 'Mídia');
      
      if (membersDb) {
        setDbMembers(membersDb);
      }

      const [y, m] = selectedMonthStr.split('-');
      const startDate = `${y}-${m}-01`;
      const endDate = `${y}-${m}-31`;

      const { data: escalasDb } = await supabase
        .from('escalas')
        .select('*')
        .eq('department', 'Mídia')
        .gte('date', startDate)
        .lte('date', endDate);

      if (escalasDb) {
        const novasEscalas: Record<string, Record<string, string[]>> = {};
        escalasDb.forEach(esc => {
          const dt = esc.date;
          if (!novasEscalas[dt]) novasEscalas[dt] = {};
          if (!novasEscalas[dt][esc.role]) novasEscalas[dt][esc.role] = [];
          novasEscalas[dt][esc.role].push(esc.member_id);
        });
        setEscalasGlobais(novasEscalas);
      }
    }
    loadData();
  }, [selectedMonthStr]);
  const [showPreview, setShowPreview] = useState<'dia' | 'mes' | null>(null);

  useEffect(() => {
    const dates = getCultosDoMes(selectedMonthStr);
    setTimelineDates(dates);
    if (!dates.includes(activeDate)) {
      setActiveDate(dates[0] || new Date().toISOString().split('T')[0]);
    }
  }, [selectedMonthStr]);

  const addCustomDate = () => {
    const input = prompt('Digite a data extra no formato AAAA-MM-DD');
    if (input && !timelineDates.includes(input)) {
      setTimelineDates(prev => [...prev, input].sort());
      setActiveDate(input);
    }
  };

  const calendarDays = useMemo(() => {
    const [y, m] = selectedMonthStr.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay(); 
    const daysInMonth = new Date(y, m, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [selectedMonthStr]);

  const escala = escalasGlobais[activeDate] || {};

  const handleAssign = async (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      if (currentAssigned.includes(memberId)) return prev;
      return { ...prev, [activeDate]: { ...dayScale, [role]: [...currentAssigned, memberId] } };
    });

    const { error } = await supabase
      .from('escalas')
      .insert({
        date: activeDate,
        department: 'Mídia',
        role: role,
        member_id: memberId,
        church_id: currentUser?.churchId || null
      });

    if (error) {
      console.error('Erro ao salvar escala no banco:', error.message);
    }
  };

  const handleRemove = async (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      return { ...prev, [activeDate]: { ...dayScale, [role]: currentAssigned.filter(id => id !== memberId) } };
    });

    const { error } = await supabase
      .from('escalas')
      .delete()
      .eq('date', activeDate)
      .eq('department', 'Mídia')
      .eq('role', role)
      .eq('member_id', memberId);

    if (error) {
      console.error('Erro ao remover escala do banco:', error.message);
    }
  };

  const stats = useMemo(() => {
    const total = dbMembers.length;
    const ativos = dbMembers.filter(m => m.status === 'ativo').length;
    const porFuncao = dbMembers.reduce((acc, m) => {
      acc[m.function] = (acc[m.function] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, ativos, inativos: total - ativos, porFuncao };
  }, [dbMembers]);

  const participacoesMes = useMemo(() => {
    const contagem: Record<string, number> = {};
    timelineDates.forEach(date => {
      const scaleDay = escalasGlobais[date];
      if (scaleDay) {
        Object.values(scaleDay).forEach(members => {
          members.forEach(id => {
            contagem[id] = (contagem[id] || 0) + 1;
          });
        });
      }
    });
    return Object.entries(contagem)
      .map(([id, count]) => ({ member: dbMembers.find(m => m.id === id), count }))
      .filter(item => item.member)
      .sort((a, b) => b.count - a.count);
  }, [escalasGlobais, timelineDates]);

  const generateWhatsAppText = (type: 'dia' | 'mes') => {
    let text = `*Escala da Mídia* 🎥\n\n`;

    if (type === 'dia') {
      text += `📅 Data: ${activeDate.split('-').reverse().join('/')}\n\n`;
      MIDIA_ROLES.forEach(role => {
        const assigned = escala[role] || [];
        if (assigned.length > 0) {
          const names = assigned.map(id => dbMembers.find(m => m.id === id)?.name).join(', ');
          text += `*${role}:* ${names}\n`;
        }
      });
    } else {
      text += `🗓️ *Mês: ${selectedMonthStr.split('-').reverse().join('/')}*\n\n`;
      let hasAnyScale = false;
      timelineDates.forEach(date => {
        const dayScale = escalasGlobais[date];
        if (dayScale && Object.values(dayScale).some(arr => arr.length > 0)) {
          hasAnyScale = true;
          text += `📅 *${date.split('-').reverse().join('/')}*\n`;
          MIDIA_ROLES.forEach(role => {
            const assigned = dayScale[role] || [];
            if (assigned.length > 0) {
              const names = assigned.map(id => dbMembers.find(m => m.id === id)?.name).join(', ');
              text += `  - ${role}: ${names}\n`;
            }
          });
          text += `\n`;
        }
      });
      if (!hasAnyScale) text += `Nenhuma escala montada neste mês.\n`;
    }

    text += `\n_A técnica a serviço do Reino!_ 💡`;
    return text;
  };

  const handleCopyWhatsApp = (type: 'dia' | 'mes') => {
    navigator.clipboard.writeText(generateWhatsAppText(type));
  };

  const handleSendWhatsApp = (type: 'dia' | 'mes') => {
    const text = generateWhatsAppText(type);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const renderAvatar = (roleName: string, id: string) => {
    const m = dbMembers.find(x => x.id === id);
    const initial = m ? m.name.charAt(0).toUpperCase() : '?';
    return (
      <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #111, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 10px rgba(0,0,0,0.8)', color: '#fff' }}>
          {initial}
        </div>
        <div style={{ fontSize: '0.65rem', marginTop: '4px', textAlign: 'center', width: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m?.name.split(' ')[0]}</div>
        <div style={{ fontSize: '0.55rem', color: '#95a5a6' }}>{roleName}</div>
      </div>
    );
  }

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '20px', paddingBottom: '20px' }}>
      
      <div className="header" style={{ marginBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary-light)', margin: 0 }}>🎥 Ministério de Mídia</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Escalas da Cabine Técnica, Som e Imagem</span>
        </div>
      </div>

      {/* ANÁLISE GERAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Equipe Técnica</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0' }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#2ecc71' }}>{stats.ativos} Ativos / <span style={{ color: '#e74c3c' }}>{stats.inativos} Inativos</span></div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>Distribuição Operacional</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Object.entries(stats.porFuncao).map(([func, count]) => (
              <div key={func} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#3498db' }}>{String(count)}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{func}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px', gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>Ranking de Operação (Mês: {selectedMonthStr.split('-').reverse().join('/')})</div>
          {participacoesMes.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '10px' }}>Nenhuma escala computada neste mês.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '100px', overflowY: 'auto', paddingRight: '10px' }}>
              {participacoesMes.map((item, idx) => (
                <div key={item.member?.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '15px', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{idx + 1}º</div>
                  <div style={{ width: '80px', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.member?.name}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px' }}>
                    <div style={{ width: `${Math.min((item.count / 10) * 100, 100)}%`, background: 'var(--primary-light)', height: '100%', borderRadius: '5px', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '20px', textAlign: 'right' }}>{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(320px, 2fr) minmax(280px, 1.2fr)', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* COLUNA 1 */}
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>📅 Seleção de Data</h3>
          
          <input 
            type="month" 
            value={selectedMonthStr}
            onChange={(e) => setSelectedMonthStr(e.target.value)}
            className="search-input glass-input"
            style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', width: '100%' }}
          />

          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} style={{ minHeight: '30px' }} />;
                const dayNumber = parseInt(dateStr.split('-')[2], 10);
                const isActive = dateStr === activeDate;
                const hasScale = Object.values(escalasGlobais[dateStr] || {}).some(arr => arr.length > 0);
                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      if (!timelineDates.includes(dateStr)) setTimelineDates(prev => [...prev, dateStr].sort());
                      setActiveDate(dateStr);
                    }}
                    style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: isActive ? 'var(--primary-light)' : (hasScale ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.02)'), border: isActive ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#fff' : 'var(--sidebar-text)', transition: 'all 0.2s' }}
                  >
                    {dayNumber}
                    {hasScale && <div style={{ position: 'absolute', top: '2px', right: '2px', width: '4px', height: '4px', borderRadius: '50%', background: isActive ? '#fff' : '#2ecc71', boxShadow: '0 0 4px rgba(46, 204, 113, 0.5)' }} />}
                  </div>
                );
              })}
            </div>
            <button onClick={addCustomDate} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', width: '100%', marginTop: '12px' }}>
              + Dia Extra
            </button>
          </div>
        </div>

        {/* COLUNA 2 */}
        <div className="glass" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            🛠️ Alocação ({activeDate.split('-').reverse().join('/')})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {MIDIA_ROLES.map(role => {
              const assignedMembers = escala[role] || [];
              const suggestedMembers = dbMembers.filter(m => m.function === role && m.status === 'ativo' && !assignedMembers.includes(m.id));

              return (
                <div key={role} style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#3498db', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>{role}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '30px', marginBottom: '10px' }}>
                    {assignedMembers.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Vazio.</div>
                    ) : (
                      assignedMembers.map(id => {
                        const member = dbMembers.find(m => m.id === id);
                        return (
                          <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db', padding: '4px 8px', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#fff' }}>{member?.name}</span>
                            <button onClick={() => handleRemove(role, id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>×</button>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <select className="search-input glass-input" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }} value="" onChange={(e) => { if (e.target.value) handleAssign(role, e.target.value); }}>
                    <option value="" disabled>+ {role}</option>
                    {suggestedMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    <optgroup label="Técnicos de outras áreas">
                      {dbMembers.filter(m => m.function !== role && m.status === 'ativo' && !assignedMembers.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </optgroup>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 3 */}
        <div className="glass" style={{ flex: '1', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🖥️ Cabine Técnica</h3>
          
          {/* CABINE VISUAL */}
          <div style={{ flex: 1, background: '#0a0a0a', borderRadius: '10px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '60px', background: 'linear-gradient(to top, rgba(52, 152, 219, 0.1), transparent)' }} />
            
            {/* Telão de monitoramento fictício no topo */}
            <div style={{ width: '100%', height: '40px', background: '#000', border: '2px solid #333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '50%', boxShadow: '0 0 8px red' }} />
               <span style={{ fontSize: '0.6rem', color: '#fff', marginLeft: '6px', letterSpacing: '2px' }}>REC</span>
            </div>

            {/* Fotografia (Frente do palco) */}
            {escala['Fotografia'] && escala['Fotografia'].length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 1, padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderStyle: 'dashed', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)' }}>
                {escala['Fotografia'].map(id => renderAvatar('Fotógrafo', id))}
              </div>
            )}

            {/* Mesa principal (Som, Transmissão, Projeção, Iluminação) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', zIndex: 1, flexWrap: 'wrap', marginTop: '10px' }}>
               { (escala['Projeção'] || []).map(id => renderAvatar('Lyrics', id)) }
               { (escala['Transmissão'] || []).map(id => renderAvatar('Câmeras', id)) }
               { (escala['Som'] || []).map(id => renderAvatar('Mesa de Som', id)) }
               { (escala['Iluminação'] || []).map(id => renderAvatar('Luzes', id)) }
            </div>
            
            {Object.values(escala).flat().length === 0 && (
              <div style={{ color: '#444', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>Cabine Vazia.</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setShowPreview('dia')}
              style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
            >
              💾 Salvar Equipe ({activeDate.split('-').reverse().slice(0,2).join('/')})
            </button>
            <button 
              onClick={() => setShowPreview('mes')}
              style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
            >
              💾 Salvar Escala Completa (Mês)
            </button>
          </div>
        </div>

        {/* POPUP DE PREVIEW */}
        {showPreview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setShowPreview(null)}>
            <div className="glass" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Preview da Escala</h3>
                <button onClick={() => setShowPreview(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', overflowY: 'auto', maxHeight: '40vh', whiteSpace: 'pre-line', fontSize: '0.85rem', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.05)' }}>
                {generateWhatsAppText(showPreview)}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => { handleCopyWhatsApp(showPreview); setShowPreview(null); }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                >
                  📋 Copiar Texto
                </button>
                <button 
                  onClick={() => { handleSendWhatsApp(showPreview); setShowPreview(null); }}
                  style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>💬</span> Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
