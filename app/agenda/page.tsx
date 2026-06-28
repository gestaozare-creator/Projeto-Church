"use client";

import { useState, useMemo, useEffect } from 'react';
import { ChurchEvent, Church } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function AgendaPage() {
  const { currentUser, canSeeAllChurches } = useAuth();
  
  // Estados da Agenda
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 23)); // Focando em Junho de 2026 como base
  const [selectedChurchId, setSelectedChurchId] = useState<string>(canSeeAllChurches ? 'all' : (currentUser?.churchId || '1'));
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const [dbChurches, setDbChurches] = useState<any[]>([]);

  // Efeito para carregar eventos e igrejas do Supabase
  useEffect(() => {
    async function fetchData() {
      // Fetch Churches
      const { data: churchesData } = await supabase.from('churches').select('*');
      if (churchesData) {
        setDbChurches(churchesData.map(c => ({
          id: c.id,
          name: c.name,
          isHeadquarters: c.is_headquarters
        })));
      }

      // Fetch Events
      const { data, error } = await supabase
        .from('events')
        .select('*');

      if (data) {
        const formatados: ChurchEvent[] = data.map(ev => ({
          id: ev.id,
          churchId: ev.church_id || '1',
          title: ev.title,
          description: ev.description || '',
          type: ev.type as any,
          departmentId: ev.department_id || undefined,
          date: ev.date,
          startTime: ev.start_time,
          endTime: ev.end_time || undefined,
          location: ev.location || '',
          isGlobal: !!ev.is_global,
          estimatedCost: ev.estimated_cost ? Number(ev.estimated_cost) : undefined,
          actualCost: ev.actual_cost ? Number(ev.actual_cost) : undefined,
          bannerUrl: ev.banner_url || undefined,
          videoUrl: ev.video_url || undefined,
          paymentLink: ev.payment_link || undefined,
          ticketPrice: ev.ticket_price ? Number(ev.ticket_price) : undefined,
          maxCapacity: ev.max_capacity || undefined
        }));
        setEvents(formatados);
      }
    }

    fetchData();
  }, []);

  // Modais e Formulários
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<ChurchEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<ChurchEvent> | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // WhatsApp Aviso
  const [showWaModal, setShowWaModal] = useState<ChurchEvent | null>(null);
  const [waMsg, setWaMsg] = useState('');

  // Dados do formulário para novo/edição
  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title: '',
    description: '',
    type: 'culto',
    date: '2026-06-23',
    startTime: '19:30',
    endTime: '21:00',
    location: 'Templo Principal',
    isGlobal: false,
    churchId: '1',
    estimatedCost: 0,
    actualCost: 0
  });

  // Tipos de Eventos com suas cores correspondentes
  const eventTypes = [
    { value: 'culto', label: 'Culto', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    { value: 'reuniao', label: 'Reunião', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)' },
    { value: 'conferencia', label: 'Conferência', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
    { value: 'ensaio', label: 'Ensaio', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
    { value: 'social', label: 'Ação Social', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    { value: 'outro', label: 'Outro', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
  ];

  // Filtros aplicados
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Filtro de Igreja (SaaS Tenant)
      const matchesChurch = selectedChurchId === 'all' || 
                            e.churchId === selectedChurchId || 
                            (e.isGlobal && selectedChurchId !== 'all');
      
      // Filtro de Categoria
      const matchesType = selectedType === 'all' || e.type === selectedType;
      
      return matchesChurch && matchesType;
    });
  }, [events, selectedChurchId, selectedType]);

  // Lógica de Calendário Mensal
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dias do mês
  const daysInMonth = useMemo(() => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Pegar o primeiro dia da semana do mês (0 = Domingo, 6 = Sábado)
    const firstDayIndex = date.getDay();
    
    // Adicionar dias vazios para preenchimento do grid no início do mês
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Adicionar os dias reais do mês
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [year, month]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const getEventsForDay = (day: Date) => {
    if (!day) return [];
    const dateStr = day.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.date === dateStr);
  };

  // Funções CRUD Locais
  const handleOpenNew = () => {
    setFormData({
      title: '',
      description: '',
      type: 'culto',
      date: `${year}-${String(month + 1).padStart(2, '0')}-23`,
      startTime: '19:30',
      endTime: '21:00',
      location: 'Templo Principal',
      isGlobal: false,
      churchId: selectedChurchId === 'all' ? '1' : selectedChurchId,
      estimatedCost: 0,
      actualCost: 0
    });
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleOpenEdit = (e: ChurchEvent) => {
    setFormData({ ...e });
    setEditingEvent(e);
    setShowDetailModal(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Erro ao excluir agendamento: ' + error.message);
        return;
      }

      setEvents(events.filter(e => e.id !== id));
      setShowDetailModal(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dbPayload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      department_id: formData.departmentId || null,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime || null,
      location: formData.location,
      is_global: !!formData.isGlobal,
      estimated_cost: formData.estimatedCost || 0,
      actual_cost: formData.actualCost || 0,
      banner_url: formData.bannerUrl || null,
      video_url: formData.videoUrl || null,
      payment_link: formData.paymentLink || null,
      ticket_price: formData.ticketPrice || 0,
      max_capacity: formData.maxCapacity || null,
      church_id: formData.churchId && formData.churchId.length > 5 ? formData.churchId : (currentUser?.churchId || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
    };

    if (editingEvent) {
      // Salvar edição no Supabase
      const { error } = await supabase
        .from('events')
        .update(dbPayload)
        .eq('id', editingEvent.id);

      if (error) {
        alert('Erro ao atualizar agendamento: ' + error.message);
        return;
      }

      setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...formData } as ChurchEvent : ev));
    } else {
      // Criar novo no Supabase
      const { data, error } = await supabase
        .from('events')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        alert('Erro ao criar agendamento: ' + error.message);
        return;
      }

      if (data) {
        const newEv: ChurchEvent = {
          id: data.id,
          churchId: data.church_id || '1',
          title: data.title,
          description: data.description || '',
          type: data.type as any,
          departmentId: data.department_id || undefined,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time || undefined,
          location: data.location || '',
          isGlobal: !!data.is_global,
          estimatedCost: data.estimated_cost ? Number(data.estimated_cost) : undefined,
          actualCost: data.actual_cost ? Number(data.actual_cost) : undefined,
          bannerUrl: data.banner_url || undefined,
          videoUrl: data.video_url || undefined,
          paymentLink: data.payment_link || undefined,
          ticketPrice: data.ticket_price ? Number(data.ticket_price) : undefined,
          maxCapacity: data.max_capacity || undefined
        };
        setEvents(p => [...p, newEv]);
      }
    }
    setShowModal(false);
  };

  const handleOpenWhatsAppShare = (ev: ChurchEvent) => {
    const tipoLabel = eventTypes.find(t => t.value === ev.type)?.label || 'Evento';
    const msg = `📢 *AVISO IMPORTANTE* - ${ev.isGlobal ? 'Rede ChurchFlow' : 'Comunidade Local'}\n\n🗓️ *${ev.title}* (${tipoLabel})\n📅 Data: ${new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${ev.startTime}${ev.endTime ? ` às ${ev.endTime}` : ''}\n📍 Local: ${ev.location}\n\n_${ev.description || ''}_`;
    setWaMsg(msg);
    setShowWaModal(ev);
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank');
    setShowWaModal(null);
  };

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '20px', paddingBottom: '30px' }}>
      
      {/* HEADER E CONTROLES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Agenda & Calendário
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Programação unificada da Sede e Filiais locais.
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{ 
                background: viewMode === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' 
              }}>
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ 
                background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' 
              }}>
              Lista
            </button>
          </div>

          <button 
            onClick={handleOpenNew}
            style={{ 
              background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '10px 18px', 
              borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--primary-glow)'
            }}>
            + Novo Evento
          </button>
        </div>
      </div>

      {/* FILTROS SAAS E CATEGORIAS */}
      <div className="glass" style={{ padding: '15px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          
          {/* Seletor de Congregação (SaaS Tenant) */}
          {canSeeAllChurches && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Visualizar Agenda de:</span>
              <select 
                value={selectedChurchId}
                onChange={(e) => setSelectedChurchId(e.target.value)}
                style={{ 
                  background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' 
                }}>
                <option value="all" style={{ background: '#111' }}>Todas as Congregações (e Global)</option>
                {dbChurches.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#111' }}>
                    {c.name} {c.isHeadquarters ? '★ Sede' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Categoria */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Filtrar Tipo:</span>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
                padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' 
              }}>
              <option value="all" style={{ background: '#111' }}>Todos os Eventos</option>
              {eventTypes.map(t => (
                <option key={t.value} value={t.value} style={{ background: '#111' }}>{t.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Legenda de Categorias */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          {eventTypes.map(t => (
            <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>GLOBAL</span>
            <span style={{ color: 'var(--text-secondary)' }}>Sede/Matriz</span>
          </div>
        </div>
      </div>

      {/* VISUALIZAÇÃO DA AGENDA */}
      {viewMode === 'calendar' ? (
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* CONTROLADOR DO MÊS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
            <button 
              onClick={prevMonth}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ◀
            </button>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {monthNames[month]} {year}
            </h4>
            <button 
              onClick={nextMonth}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ▶
            </button>
          </div>

          {/* CABEÇALHO DOS DIAS DA SEMANA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', background: 'rgba(0,0,0,0.1)', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <div>DOM</div>
            <div>SEG</div>
            <div>TER</div>
            <div>QUA</div>
            <div>QUI</div>
            <div>SEX</div>
            <div>SÁB</div>
          </div>

          {/* GRID DE DIAS DO CALENDÁRIO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, 1fr)', flex: 1 }}>
            {daysInMonth.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={idx}
                  style={{ 
                    borderRight: '1px solid rgba(255,255,255,0.03)', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    padding: '8px',
                    background: day ? (isToday ? 'rgba(56, 189, 248, 0.05)' : 'transparent') : 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}>
                  {day && (
                    <>
                      {/* Número do Dia */}
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isToday ? 'bold' : 'normal', 
                        color: isToday ? 'var(--primary-light)' : 'var(--text-secondary)',
                        alignSelf: 'flex-start',
                        width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? 'rgba(56, 189, 248, 0.2)' : 'transparent'
                      }}>
                        {day.getDate()}
                      </span>

                      {/* Lista de Eventos no Dia */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', flex: 1, overflowY: 'auto' }}>
                        {dayEvents.map(ev => {
                          const catInfo = eventTypes.find(t => t.value === ev.type);
                          return (
                            <div 
                              key={ev.id}
                              onClick={() => setShowDetailModal(ev)}
                              style={{ 
                                background: catInfo?.bg || 'rgba(255,255,255,0.05)',
                                borderLeft: `3px solid ${catInfo?.color || '#fff'}`,
                                padding: '3px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                color: '#fff',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'transform 0.15s ease'
                              }}
                              className="scale-hover"
                              title={ev.title}>
                              <span style={{ fontWeight: 'bold' }}>{ev.startTime}</span> {ev.title}
                              {ev.isGlobal && (
                                <span style={{ marginLeft: '4px', fontSize: '0.55rem', background: 'rgba(255,255,255,0.2)', padding: '0 3px', borderRadius: '2px', fontWeight: 'bold' }}>G</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA CRONOLÓGICA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEvents.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhum evento agendado para o filtro selecionado.
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(ev => {
                const catInfo = eventTypes.find(t => t.value === ev.type);
                return (
                  <div 
                    key={ev.id} 
                    className="glass" 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderLeft: `5px solid ${catInfo?.color || '#fff'}`,
                      flexWrap: 'wrap',
                      gap: '15px'
                    }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                          {new Date(ev.date + 'T00:00:00').getDate()}
                        </div>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {ev.title}
                          {ev.isGlobal && (
                            <span style={{ fontSize: '0.6rem', background: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>GLOBAL</span>
                          )}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          ⏰ {ev.startTime} • 📍 {ev.location}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenWhatsAppShare(ev)}
                        style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        💬 Comunicar
                      </button>
                      <button 
                        onClick={() => setShowDetailModal(ev)}
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* MODAL DETALHES DO EVENTO */}
      {showDetailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--glass-shadow)', border: '1px solid rgba(255,255,255,0.15)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Detalhes do Agendamento</h4>
              <button onClick={() => setShowDetailModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', background: eventTypes.find(t => t.value === showDetailModal.type)?.bg, color: eventTypes.find(t => t.value === showDetailModal.type)?.color, padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {eventTypes.find(t => t.value === showDetailModal.type)?.label}
                </span>
                {showDetailModal.isGlobal && (
                  <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: 'var(--primary-color)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    GLOBAL
                  </span>
                )}
                <h3 style={{ fontSize: '1.4rem', margin: '8px 0 4px', color: '#fff' }}>{showDetailModal.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  📅 Data: {new Date(showDetailModal.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {showDetailModal.startTime}h {showDetailModal.endTime ? `às ${showDetailModal.endTime}h` : ''}
                </p>
              </div>

              {showDetailModal.description && (
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Descrição / Pauta:</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{showDetailModal.description}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Local:</div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px' }}>📍 {showDetailModal.location}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Organização:</div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px' }}>
                    {showDetailModal.departmentId ? `👥 Dep. ${showDetailModal.departmentId}` : '🏛️ Geral'}
                  </div>
                </div>
              </div>

              {/* Custos (Caso existam) */}
              {(showDetailModal.estimatedCost || showDetailModal.actualCost) ? (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>📊 Balanço de Custos:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Orçado: <strong style={{ color: '#fb923c' }}>R$ {showDetailModal.estimatedCost?.toLocaleString('pt-BR')}</strong></span>
                    <span>Realizado: <strong style={{ color: '#34d399' }}>R$ {showDetailModal.actualCost?.toLocaleString('pt-BR')}</strong></span>
                  </div>
                </div>
              ) : null}

              {/* Ações */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => handleOpenWhatsAppShare(showDetailModal)}
                  style={{ flex: 1, background: '#2ecc71', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  💬 Compartilhar
                </button>
                <button 
                  onClick={() => handleOpenEdit(showDetailModal)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  ✏️ Editar
                </button>
                <button 
                  onClick={() => handleDelete(showDetailModal.id)}
                  style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  🗑️ Excluir
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR / EDITAR EVENTO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <form onSubmit={handleSubmit} className="glass" style={{ width: '100%', maxWidth: '550px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{editingEvent ? 'Editar Agendamento' : 'Novo Agendamento'}</h4>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Título do Evento *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  placeholder="Ex: Culto da Juventude" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo de Evento</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {eventTypes.map(t => (
                      <option key={t.value} value={t.value} style={{ background: '#111' }}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Departamento Vinculado</label>
                  <select 
                    value={formData.departmentId || ''} 
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value || undefined })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="" style={{ background: '#111' }}>Nenhum (Geral)</option>
                    <option value="Louvor" style={{ background: '#111' }}>Louvor</option>
                    <option value="Mídia" style={{ background: '#111' }}>Mídia</option>
                    <option value="Obreiros" style={{ background: '#111' }}>Obreiros</option>
                    <option value="Infantil" style={{ background: '#111' }}>Infantil</option>
                    <option value="Evangelismo" style={{ background: '#111' }}>Evangelismo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Início *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.startTime} 
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Término</label>
                  <input 
                    type="time" 
                    value={formData.endTime || ''} 
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value || undefined })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Local do Evento</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  placeholder="Ex: Templo Central ou Auditório de Convenções" 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Descrição / Observações</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                  placeholder="Pauta da reunião, detalhes adicionais ou avisos especiais." 
                />
              </div>

              {/* Custos do Evento */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>📊 Custos Financeiros (Opcional):</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custo Orçado (R$)</label>
                    <input 
                      type="number" 
                      value={formData.estimatedCost || 0} 
                      onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                      style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custo Efetivo (R$)</label>
                    <input 
                      type="number" 
                      value={formData.actualCost || 0} 
                      onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })}
                      style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle de Evento Global SaaS (Só Sede/Master) */}
              {canSeeAllChurches && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(56, 189, 248, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                  <input 
                    type="checkbox" 
                    id="isGlobal"
                    checked={formData.isGlobal} 
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isGlobal" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    🌎 Evento Global (Visível para todas as congregações da rede)
                  </label>
                </div>
              )}

            </div>

            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}>
                Salvar Evento
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL COMPARTILHAR WHATSAPP */}
      {showWaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>📢 Comunicar via WhatsApp</h4>
              <button onClick={() => setShowWaModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prévia da mensagem formatada para disparo em grupos ou contatos da igreja:</span>
              
              <textarea 
                value={waMsg} 
                onChange={(e) => setWaMsg(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', resize: 'vertical', minHeight: '180px', fontFamily: 'monospace' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowWaModal(null)}
                  style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button 
                  onClick={sendWhatsApp}
                  style={{ flex: 2, background: '#2ecc71', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  🚀 Compartilhar Agora
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
