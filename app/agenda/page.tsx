"use client";

import { useState, useMemo, useEffect } from 'react';
import { ChurchEvent, Church } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function AgendaPage() {
  const { currentUser, canSeeAllChurches } = useAuth();
  
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 23)); 
  const [selectedChurchId, setSelectedChurchId] = useState<string>(canSeeAllChurches ? 'all' : (currentUser?.churchId || '1'));
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dbChurches, setDbChurches] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date(2026, 5, 23));
  const [editingEvent, setEditingEvent] = useState<Partial<ChurchEvent> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [showWaModal, setShowWaModal] = useState<ChurchEvent | null>(null);

  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title: '', description: '', type: 'culto', date: '2026-06-23', startTime: '19:30', endTime: '21:00', location: 'Templo Principal', isGlobal: false, churchId: '1'
  });

  const eventTypes = [
    { value: 'culto', label: 'Culto', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    { value: 'reuniao', label: 'Reunião', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)' },
    { value: 'conferencia', label: 'Conferência', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
    { value: 'ensaio', label: 'Ensaio', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
    { value: 'social', label: 'Ação Social', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    { value: 'outro', label: 'Outro', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: churchesData } = await supabase.from('churches').select('*');
      if (churchesData) {
        setDbChurches(churchesData.map(c => ({ id: c.id, name: c.name, isHeadquarters: c.is_headquarters })));
      }
      const { data, error } = await supabase.from('events').select('*');
      if (data) {
        const formatados: ChurchEvent[] = data.map(ev => {
          let extra: any = {};
          try {
             if (ev.description && ev.description.startsWith('{')) {
               extra = JSON.parse(ev.description);
             }
          } catch(e) {}
          return {
            id: ev.id, churchId: ev.church_id || '1', title: ev.title, date: ev.date, 
            description: extra.description || ev.description || '', type: extra.type || 'culto',
            startTime: extra.startTime || '19:30', endTime: extra.endTime || '', location: extra.location || '', isGlobal: !!extra.isGlobal
          };
        });
        setEvents(formatados);
      }
    }
    fetchData();
  }, []);

  const isGuadalupe = currentUser?.churchId === '1782771173659' || dbChurches.find(c => c.id === currentUser?.churchId)?.isHeadquarters;
  const canCreateGlobal = canSeeAllChurches || isGuadalupe;

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesChurch = e.isGlobal || e.churchId === (canSeeAllChurches ? selectedChurchId : currentUser?.churchId);
      if (selectedChurchId !== 'all' && !e.isGlobal && e.churchId !== selectedChurchId) return false;
      const matchesType = selectedType === 'all' || e.type === selectedType;
      return matchesChurch && matchesType;
    });
  }, [events, selectedChurchId, selectedType, canSeeAllChurches, currentUser]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    const date = new Date(year, month, 1);
    const days = [];
    for (let i = 0; i < date.getDay(); i++) days.push(null);
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [year, month]);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleOpenNew = () => {
    setFormData({
      title: '', description: '', type: 'culto', date: selectedDay ? selectedDay.toISOString().split('T')[0] : `${year}-${String(month + 1).padStart(2, '0')}-23`,
      startTime: '19:30', endTime: '', location: '', isGlobal: false, churchId: canSeeAllChurches && selectedChurchId !== 'all' ? selectedChurchId : (currentUser?.churchId || '1')
    });
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleOpenEdit = (e: ChurchEvent) => {
    setFormData({ ...e });
    setEditingEvent(e);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este evento?')) {
      await supabase.from('events').delete().eq('id', id);
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const extraData = {
      description: formData.description, type: formData.type, startTime: formData.startTime,
      endTime: formData.endTime, location: formData.location, isGlobal: !!formData.isGlobal
    };
    
    const dbPayload = {
      title: formData.title, date: formData.date, description: JSON.stringify(extraData),
      status: 'agendado', church_id: formData.churchId || currentUser?.churchId || '1'
    };

    if (editingEvent) {
      await supabase.from('events').update(dbPayload).eq('id', editingEvent.id);
      setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...formData } as ChurchEvent : ev));
    } else {
      const { data } = await supabase.from('events').insert(dbPayload).select().single();
      if (data) {
        setEvents(p => [...p, { id: data.id, ...formData } as ChurchEvent]);
      }
    }
    setShowForm(false);
  };

  const dayEvents = selectedDay ? filteredEvents.filter(e => e.date === selectedDay.toISOString().split('T')[0]) : [];

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '20px', paddingBottom: '30px' }}>
      
      {/* HEADER E CONTROLES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Agenda Inteligente</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Programação unificada da Sede e Filiais locais.</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleOpenNew} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>+ Novo Evento</button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {canSeeAllChurches && (
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 'bold' }}>VISUALIZAR AGENDA DE:</label>
            <select value={selectedChurchId} onChange={(e) => setSelectedChurchId(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px', height: '42px' }}>
              <option value="all">Todas as Congregações (e Global)</option>
              {dbChurches.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.isHeadquarters ? '(Sede)' : ''}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 'bold' }}>FILTRAR TIPO:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input-field" style={{ width: '100%', padding: '10px', height: '42px' }}>
            <option value="all">Todos os Eventos</option>
            {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* CALENDÁRIO (50%) */}
        <div style={{ flex: '1 1 45%', minWidth: '300px', background: 'rgba(15,23,42,0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>◀</button>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{monthNames[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>▶</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {daysInMonth.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} style={{ padding: '20px' }} />;
              const isSelected = selectedDay?.getDate() === day.getDate() && selectedDay?.getMonth() === day.getMonth();
              const dateStr = day.toISOString().split('T')[0];
              const evts = filteredEvents.filter(e => e.date === dateStr);
              return (
                <div key={idx} onClick={() => { setSelectedDay(day); setShowForm(false); }} 
                     style={{
                       background: isSelected ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.03)',
                       border: isSelected ? '1px solid #3498db' : '1px solid transparent',
                       borderRadius: '8px', padding: '10px 5px', cursor: 'pointer', minHeight: '60px',
                       display: 'flex', flexDirection: 'column', alignItems: 'center', transition: '0.2s'
                     }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 800 : 500, color: isSelected ? '#fff' : '#ccc' }}>{day.getDate()}</span>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {evts.slice(0, 3).map((e, i) => {
                      const typeConf = eventTypes.find(t => t.value === e.type);
                      return <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: typeConf?.color || '#3498db' }} title={e.title}/>
                    })}
                    {evts.length > 3 && <span style={{ fontSize: '0.5rem', color: '#999' }}>+</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETALHES DO DIA / FORMULÁRIO (50%) */}
        <div style={{ flex: '1 1 45%', minWidth: '300px', background: 'rgba(15,23,42,0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {showForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✖ Fechar</button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="input-field" required style={{ width: '100%' }}>
                    {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Título do Evento</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" required style={{ width: '100%' }} placeholder="Ex: Culto de Celebração" />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Início</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="input-field" required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fim (Opcional)</label>
                  <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Localização</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input-field" style={{ width: '100%' }} placeholder="Ex: Templo Principal" />
              </div>
              
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Descrição Completa</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" rows={3} style={{ width: '100%', resize: 'none' }} placeholder="Detalhes adicionais..." />
              </div>

              {canCreateGlobal && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(52,152,219,0.1)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isGlobal} onChange={e => setFormData({...formData, isGlobal: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#3498db' }}>Evento Global da Rede</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Todas as igrejas verão este evento na agenda.</span>
                  </div>
                </label>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Salvar Evento</button>
            </form>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Eventos do dia {selectedDay ? selectedDay.toLocaleDateString('pt-BR') : ''}</span>
                <span style={{ background: '#3498db', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{dayEvents.length}</span>
              </h3>

              {dayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.5 }}>📅</div>
                  <p>Nenhum evento programado para esta data.</p>
                  <button onClick={handleOpenNew} className="btn-secondary" style={{ marginTop: '10px' }}>Agendar algo agora</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dayEvents.map(ev => {
                    const typeConf = eventTypes.find(t => t.value === ev.type);
                    return (
                      <div key={ev.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px', borderLeft: `4px solid ${typeConf?.color || '#3498db'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ background: typeConf?.bg, color: typeConf?.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{typeConf?.label}</span>
                              {ev.isGlobal && <span style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>GLOBAL</span>}
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>{ev.title}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span>⏰ {ev.startTime} {ev.endTime ? `às ${ev.endTime}` : ''}</span>
                              {ev.location && <span>📍 {ev.location}</span>}
                              {ev.description && <span style={{ marginTop: '6px', color: '#ccc' }}>{ev.description}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => {
                               const msg = `📢 *AVISO IMPORTANTE* - ${ev.isGlobal ? 'Rede ChurchFlow' : 'Comunidade Local'}\n\n🗓️ *${ev.title}* (${typeConf?.label || 'Evento'})\n📅 Data: ${new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${ev.startTime}${ev.endTime ? ` às ${ev.endTime}` : ''}\n📍 Local: ${ev.location || 'A definir'}\n\n_${ev.description || ''}_`;
                               window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            }} style={{ background: 'rgba(46,204,113,0.15)', border: 'none', color: '#2ecc71', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }} title="Compartilhar no WhatsApp">W</button>
                            {(canSeeAllChurches || ev.churchId === currentUser?.churchId) && (
                              <>
                                <button onClick={() => handleOpenEdit(ev)} style={{ background: 'rgba(52,152,219,0.15)', border: 'none', color: '#3498db', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}>✎</button>
                                <button onClick={() => handleDelete(ev.id)} style={{ background: 'rgba(231,76,60,0.15)', border: 'none', color: '#e74c3c', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}>🗑</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
