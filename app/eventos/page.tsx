"use client";

import { useState, useMemo, useEffect } from 'react';
import { MOCK_CHURCHES, MOCK_TRANSACTIONS, MOCK_MEMBERS, ChurchEvent, EventGuest, Church } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function EventosPage() {
  const { currentUser, canSeeAllChurches } = useAuth();

  // Estados principais
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedChurchId, setSelectedChurchId] = useState<string>(canSeeAllChurches ? 'all' : (currentUser?.churchId || '1'));

  // Carregar dados de Eventos e Convidados do Supabase
  useEffect(() => {
    async function fetchEventsAndGuests() {
      // 1. Carregar eventos
      const { data: eventsDb } = await supabase
        .from('events')
        .select('*');

      const formatadosEvents: ChurchEvent[] = (eventsDb || []).map(ev => ({
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

      // 2. Carregar convidados
      const { data: guestsDb } = await supabase
        .from('event_guests')
        .select('*');

      const formatadosGuests: EventGuest[] = (guestsDb || []).map(g => ({
        id: g.id,
        eventId: g.event_id,
        memberName: g.member_name,
        memberPhone: g.member_phone,
        status: g.status as any,
        ticketPricePaid: g.ticket_price_paid ? Number(g.ticket_price_paid) : 0
      }));

      setEvents(formatadosEvents);
      setGuests(formatadosGuests);

      if (formatadosEvents.length > 0) {
        setSelectedEventId(formatadosEvents[0].id);
      }
    }

    fetchEventsAndGuests();
  }, []);

  // Modais de Criação/Edição e Integração
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [integrationSuccess, setIntegrationSuccess] = useState(false);

  // Form de Novo Evento
  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title: '',
    description: '',
    type: 'conferencia',
    date: '2026-06-30',
    startTime: '19:00',
    endTime: '22:00',
    location: 'Auditório Principal',
    isGlobal: false,
    churchId: '1',
    estimatedCost: 1000,
    actualCost: 950,
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    videoUrl: '',
    paymentLink: '',
    ticketPrice: 0,
    maxCapacity: 100
  });

  // Form de Novo Convidado/Inscrição
  const [guestFormData, setGuestFormData] = useState({
    memberName: '',
    memberPhone: '',
    status: 'confirmado_pago' as any,
    ticketPricePaid: 0
  });

  // WhatsApp
  const [waMsg, setWaMsg] = useState('');
  const [showWaModal, setShowWaModal] = useState(false);
  const [selectedGuestForWhatsApp, setSelectedGuestForWhatsApp] = useState<EventGuest | null>(null);
  const [massSendSimulation, setMassSendSimulation] = useState<{ active: boolean; currentIndex: number; total: number; status: 'sending' | 'success' } | null>(null);

  // Evento selecionado atual
  const activeEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId);
  }, [events, selectedEventId]);

  // Convidados do evento ativo
  const activeEventGuests = useMemo(() => {
    return guests.filter(g => g.eventId === selectedEventId);
  }, [guests, selectedEventId]);

  // Lista de eventos filtrada por igreja
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      return selectedChurchId === 'all' || e.churchId === selectedChurchId || e.isGlobal;
    });
  }, [events, selectedChurchId]);

  // Cultos fixos da igreja selecionada
  const activeChurchServices = useMemo(() => {
    if (selectedChurchId === 'all') {
       return MOCK_CHURCHES.flatMap(c => (c.services || []).map(s => ({...s, churchName: c.name})));
    }
    const church = MOCK_CHURCHES.find(c => c.id === selectedChurchId);
    return church?.services?.map(s => ({...s, churchName: church.name})) || [];
  }, [selectedChurchId]);

  // BLOCO 1: Métricas de Convites, Presenças, Receitas e ROI do evento ativo
  const metrics = useMemo(() => {
    if (!activeEvent) return { total: 0, pendentes: 0, confirmados: 0, recusados: 0, receita: 0, custo: 0, roi: 0 };

    const total = activeEventGuests.length;
    const pendentes = activeEventGuests.filter(g => g.status === 'pendente').length;
    const confirmados = activeEventGuests.filter(g => g.status.startsWith('confirmado')).length;
    const recusados = activeEventGuests.filter(g => g.status === 'recusado').length;

    // Receita de ingressos
    const receita = activeEventGuests.reduce((acc, curr) => acc + curr.ticketPricePaid, 0);
    const custo = activeEvent.actualCost || activeEvent.estimatedCost || 0;
    const roi = receita - custo;

    return { total, pendentes, confirmados, recusados, receita, custo, roi };
  }, [activeEvent, activeEventGuests]);

  // Formatação de Dinheiro
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Ações de Eventos
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const handleOpenNewEvent = () => {
    setFormData({
      title: '',
      description: '',
      type: 'conferencia',
      date: '2026-06-30',
      startTime: '19:00',
      endTime: '22:00',
      location: 'Auditório Principal',
      isGlobal: false,
      churchId: selectedChurchId === 'all' ? '1' : selectedChurchId,
      estimatedCost: 1000,
      actualCost: 950,
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      videoUrl: '',
      paymentLink: '',
      ticketPrice: 0,
      maxCapacity: 100
    });
    setEditingEventId(null);
    setShowCreateModal(true);
  };

  const handleOpenEditEvent = (ev: ChurchEvent) => {
    setFormData({ ...ev });
    setEditingEventId(ev.id);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Deseja realmente excluir este evento e todas as suas inscrições?')) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Erro ao excluir evento: ' + error.message);
        return;
      }

      const remaining = events.filter(e => e.id !== id);
      setEvents(remaining);
      setGuests(guests.filter(g => g.eventId !== id));
      if (selectedEventId === id) {
        setSelectedEventId(remaining[0]?.id || '');
      }
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
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

    if (editingEventId) {
      // Edição
      const { error } = await supabase
        .from('events')
        .update(dbPayload)
        .eq('id', editingEventId);

      if (error) {
        alert('Erro ao atualizar evento: ' + error.message);
        return;
      }

      setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, ...formData } as ChurchEvent : ev));
    } else {
      // Criação
      const { data, error } = await supabase
        .from('events')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        alert('Erro ao criar evento: ' + error.message);
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
        setSelectedEventId(data.id);
      }
    }
    setShowCreateModal(false);
    setEditingEventId(null);
  };

  // Ações de Convidados
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricePaid = guestFormData.status === 'confirmado_pago' ? (activeEvent?.ticketPrice || 0) : 0;
    
    const dbPayload = {
      event_id: selectedEventId,
      member_name: guestFormData.memberName,
      member_phone: guestFormData.memberPhone,
      status: guestFormData.status,
      ticket_price_paid: pricePaid
    };

    const { data, error } = await supabase
      .from('event_guests')
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      alert('Erro ao adicionar convidado: ' + error.message);
      return;
    }

    if (data) {
      const newGuest: EventGuest = {
        id: data.id,
        eventId: data.event_id,
        memberName: data.member_name,
        memberPhone: data.member_phone,
        status: data.status as any,
        ticketPricePaid: Number(data.ticket_price_paid)
      };

      setGuests(p => [...p, newGuest]);
    }

    setShowInviteModal(false);
    setGuestFormData({ memberName: '', memberPhone: '', status: 'confirmado_pago', ticketPricePaid: 0 });
  };

  const handleUpdateGuestStatus = async (guestId: string, newStatus: any) => {
    const pricePaid = newStatus === 'confirmado_pago' ? (activeEvent?.ticketPrice || 0) : 0;

    const { error } = await supabase
      .from('event_guests')
      .update({
        status: newStatus,
        ticket_price_paid: pricePaid
      })
      .eq('id', guestId);

    if (error) {
      alert('Erro ao atualizar status do convidado: ' + error.message);
      return;
    }

    setGuests(guests.map(g => {
      if (g.id === guestId) {
        return { ...g, status: newStatus, ticketPricePaid: pricePaid };
      }
      return g;
    }));
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (confirm('Deseja remover este convidado/registro do evento?')) {
      const { error } = await supabase
        .from('event_guests')
        .delete()
        .eq('id', guestId);

      if (error) {
        alert('Erro ao remover convidado: ' + error.message);
        return;
      }

      setGuests(guests.filter(g => g.id !== guestId));
    }
  };

  // Integração com o Financeiro Geral
  const handleIntegrateWithFinance = () => {
    if (!activeEvent) return;

    // Criar uma despesa baseada no custo do evento no mock geral
    const newExpense = {
      id: `t-evt-c-${Date.now()}`,
      churchId: activeEvent.churchId === 'GLOBAL' ? '1' : activeEvent.churchId,
      type: 'despesa' as const,
      category: 'Manutenção/Eventos',
      description: `Custo Realizado Evento: ${activeEvent.title}`,
      amount: metrics.custo,
      paymentMethod: 'Boleto',
      status: 'confirmado' as const,
      date: activeEvent.date,
      paidDate: activeEvent.date
    };

    // Criar uma receita baseada na venda de ingressos
    const newRevenue = {
      id: `t-evt-r-${Date.now()}`,
      churchId: activeEvent.churchId === 'GLOBAL' ? '1' : activeEvent.churchId,
      type: 'receita' as const,
      category: 'Campanha',
      description: `Bilheteria/Inscrições Evento: ${activeEvent.title}`,
      amount: metrics.receita,
      paymentMethod: 'PIX',
      status: 'confirmado' as const,
      date: activeEvent.date,
      paidDate: activeEvent.date
    };

    MOCK_TRANSACTIONS.push(newExpense);
    if (metrics.receita > 0) {
      MOCK_TRANSACTIONS.push(newRevenue);
    }

    setIntegrationSuccess(true);
    setTimeout(() => setIntegrationSuccess(false), 3000);
  };

  // WhatsApp Quick Share do Convite
  const handleOpenWhatsAppConvite = (guest?: EventGuest) => {
    if (!activeEvent) return;
    
    const guestName = guest?.memberName;
    const saudacao = guestName ? `Olá, *${guestName}*! ` : 'Olá! ';
    const conviteTexto = `${saudacao}Temos o prazer de te convidar para o nosso evento:\n\n⭐ *${activeEvent.title}* ⭐\n📅 Data: ${new Date(activeEvent.date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${activeEvent.startTime}\n📍 Local: ${activeEvent.location}\n\n_${activeEvent.description || ''}_\n\n${activeEvent.ticketPrice && activeEvent.ticketPrice > 0 ? `🎟️ Valor da Inscrição: *${formatCurrency(activeEvent.ticketPrice)}*\n🔗 Garanta sua vaga pelo link: ${activeEvent.paymentLink || 'Link de pagamento corporativo'}` : '🎟️ Entrada Franca (Gratuita)'}\n\nConfirme sua presença respondendo esta mensagem! 🙌`;
    
    setWaMsg(conviteTexto);
    setSelectedGuestForWhatsApp(guest || null);
    setShowWaModal(true);
  };

  const sendWhatsApp = () => {
    if (selectedGuestForWhatsApp) {
      // Envio Individual Direcionado
      const phone = selectedGuestForWhatsApp.memberPhone.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(waMsg)}`, '_blank');
    } else {
      // Geral (share link)
      window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank');
    }
    setShowWaModal(false);
    setSelectedGuestForWhatsApp(null);
  };

  // Importar contatos dinamicamente do banco de membros (MOCK_MEMBERS)
  const handleImportByMinistry = (group: string) => {
    if (!activeEvent) return;
    let listToImport: { name: string; phone: string }[] = [];

    if (group === 'todos') {
      listToImport = MOCK_MEMBERS.map(m => ({ name: m.name, phone: m.phone }));
    } else if (group === 'visitantes') {
      listToImport = MOCK_MEMBERS.filter(m => m.status === 'pendente').map(m => ({ name: m.name + ' (Visitante)', phone: m.phone }));
    } else if (group === 'pastores') {
      listToImport = MOCK_MEMBERS.filter(m => m.function.toLowerCase().includes('pastor') || m.name.toLowerCase().includes('pr.')).map(m => ({ name: m.name, phone: m.phone }));
    } else {
      // Mapeamento de grupos de departamentos do sistema
      listToImport = MOCK_MEMBERS.filter(m => m.ministry === group).map(m => ({ name: m.name, phone: m.phone }));
    }

    if (listToImport.length === 0) {
      alert(`Nenhum contato encontrado no grupo: ${group}`);
      return;
    }

    const newGuests: EventGuest[] = listToImport.map((m, idx) => ({
      id: `g-imp-${group}-${idx}-${Date.now()}`,
      eventId: selectedEventId,
      memberName: m.name,
      memberPhone: m.phone,
      status: 'pendente',
      ticketPricePaid: 0
    }));

    // Filtrar apenas quem ainda não está na lista de convidados do evento
    const filteredGuests = newGuests.filter(ng => !guests.some(g => g.eventId === selectedEventId && g.memberPhone === ng.memberPhone));

    if (filteredGuests.length === 0) {
      alert(`Todos os contatos desse grupo já constam na lista deste evento.`);
      return;
    }

    setGuests([...guests, ...filteredGuests]);
    alert(`${filteredGuests.length} contatos importados com sucesso do grupo: ${group}!`);
  };

  // Simulação e Envio em Massa (WhatsApp)
  const handleMassSend = () => {
    const ev = activeEvent;
    if (!ev || activeEventGuests.length === 0) {
      alert('Nenhum convidado na lista para realizar o disparo em massa ou nenhum evento selecionado.');
      return;
    }

    setMassSendSimulation({ active: true, currentIndex: 0, total: activeEventGuests.length, status: 'sending' });

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < activeEventGuests.length) {
        setMassSendSimulation(prev => prev ? { ...prev, currentIndex: current } : null);
      } else {
        clearInterval(interval);
        setMassSendSimulation(prev => prev ? { ...prev, currentIndex: current, status: 'success' } : null);

        // Disparar o primeiro de verdade via WhatsApp Web para teste real do usuário
        const firstGuest = activeEventGuests[0];
        if (firstGuest) {
          const phone = firstGuest.memberPhone.replace(/\D/g, '');
          const saudacao = `Olá, *${firstGuest.memberName}*! `;
          const conviteTexto = `${saudacao}Temos o prazer de te convidar para o nosso evento:\n\n⭐ *${ev.title}* ⭐\n📅 Data: ${new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${ev.startTime}\n📍 Local: ${ev.location}\n\n_${ev.description || ''}_\n\n${ev.ticketPrice && ev.ticketPrice > 0 ? `🎟️ Valor da Inscrição: *${formatCurrency(ev.ticketPrice)}*\n🔗 Garanta sua vaga pelo link: ${ev.paymentLink || 'Link de pagamento corporativo'}` : '🎟️ Entrada Franca (Gratuita)'}\n\nConfirme sua presença respondendo esta mensagem! 🙌`;
          
          window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(conviteTexto)}`, '_blank');
        }

        setTimeout(() => {
          setMassSendSimulation(null);
        }, 2000);
      }
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)', width: '100%', paddingRight: '5px' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎟️ Eventos & Bilheteria
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Gerencie convites, ingressos e fluxo financeiro dos eventos dos departamentos.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {canSeeAllChurches && (
            <select 
              value={selectedChurchId}
              onChange={(e) => setSelectedChurchId(e.target.value)}
              style={{ 
                background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
                padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' 
              }}>
              <option value="all" style={{ background: '#111' }}>Todas as Congregações</option>
              {MOCK_CHURCHES.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111' }}>{c.name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={handleOpenNewEvent}
            style={{ 
              background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '10px 18px', 
              borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--primary-glow)'
            }}>
            + Criar Evento
          </button>
        </div>
      </div>

      {/* AGENDA FIXA DE CULTOS */}
      {activeChurchServices.length > 0 && (
        <div className="glass" style={{ padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Agenda Fixa de Cultos Regulares
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeChurchServices.sort((a, b) => {
               const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
               if (days.indexOf(a.dayOfWeek) !== days.indexOf(b.dayOfWeek)) return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
               return a.time.localeCompare(b.time);
            }).map((svc, idx) => (
              <div key={idx} style={{ background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', padding: '8px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: '#f1c40f', fontSize: '0.85rem' }}>{svc.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {svc.dayOfWeek} às {svc.time} {selectedChurchId === 'all' && `• ${svc.churchName}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELEÇÃO DO EVENTO ATIVO COM CONTROLES DE EDITAR/EXCLUIR */}
      <div className="glass" style={{ padding: '15px', borderRadius: '12px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', paddingRight: '4px' }}>Selecione o Evento:</span>
          {filteredEvents.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEventId(e.id)}
              style={{
                background: selectedEventId === e.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: selectedEventId === e.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: selectedEventId === e.id ? 700 : 400,
                transition: 'all 0.2s'
              }}>
              {e.title}
            </button>
          ))}
        </div>

        {activeEvent && (
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center', paddingRight: '4px' }}>Ações do Evento em Foco:</span>
            <button
              onClick={() => handleOpenEditEvent(activeEvent)}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              ✏️ Editar
            </button>
            <button
              onClick={() => handleDeleteEvent(activeEvent.id)}
              style={{ background: 'rgba(231, 76, 60, 0.05)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              🗑️ Excluir
            </button>
          </div>
        )}
      </div>

      {activeEvent ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          
          {/* COLUNA ESQUERDA: KPIs, CONSTRUTOR/PREVIEW E GESTÃO FINANCEIRA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* BLOCO 1: KPIs DO EVENTO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>👥 Convites / Ingressos</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '5px' }}>
                  {metrics.confirmados} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {metrics.total} confirmados</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {metrics.pendentes} pendentes • {metrics.recusados} recusados
                </div>
              </div>

              <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${metrics.roi >= 0 ? '#2ecc71' : '#e74c3c'}` }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>📊 Balanço de ROI</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: metrics.roi >= 0 ? '#2ecc71' : '#e74c3c', marginTop: '5px' }}>
                  {formatCurrency(metrics.roi)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Receitas: {formatCurrency(metrics.receita)} • Custos: {formatCurrency(metrics.custo)}
                </div>
              </div>
            </div>

            {/* BLOCO 2: CONSTRUTOR DO CONVITE / PREVIEW MULTIMÍDIA */}
            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>🎨 Banner do Convite & Preview</h4>
                {activeEvent.paymentLink && (
                  <a 
                    href={activeEvent.paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ background: '#f1c40f', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                    🔗 LINK DE PAGAMENTO ATIVO
                  </a>
                )}
              </div>
              
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeEvent.bannerUrl ? (
                  <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img 
                      src={activeEvent.bannerUrl} 
                      alt="Banner Evento" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: '0.55rem', background: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>{activeEvent.type}</span>
                        <h4 style={{ margin: '4px 0 0', fontSize: '1.1rem', color: '#fff' }}>{activeEvent.title}</h4>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1c40f' }}>
                        {activeEvent.ticketPrice && activeEvent.ticketPrice > 0 ? formatCurrency(activeEvent.ticketPrice) : 'Gratuito'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '120px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Nenhuma foto/banner cadastrado para este convite.
                  </div>
                )}

                {/* Vídeo Teaser Integrado */}
                {activeEvent.videoUrl && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎬</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teaser/Vídeo do Evento Ativo</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Vídeo oficial de divulgação associado.</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open(activeEvent.videoUrl, '_blank')}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Assistir Teaser
                    </button>
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {activeEvent.description || 'Nenhuma descrição adicionada.'}
                </div>
              </div>
            </div>

            {/* BLOCO 4: GESTÃO FINANCEIRA E RETORNO */}
            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>📊 Orçamento & Apontamento Geral</h4>
              </div>
              
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Orçado Estimado</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: '#fb923c' }}>
                      {formatCurrency(activeEvent.estimatedCost || 0)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Custo Efetivo</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: '#e74c3c' }}>
                      {formatCurrency(activeEvent.actualCost || 0)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Retorno Vendas</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: '#2ecc71' }}>
                      {formatCurrency(metrics.receita)}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.85rem' }}>Integração com Financeiro Geral</h5>
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Apontar receita e despesa para o caixa geral.</p>
                  </div>
                  <button
                    onClick={handleIntegrateWithFinance}
                    style={{
                      background: integrationSuccess ? '#2ecc71' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                    {integrationSuccess ? '✓ Lançado no Caixa!' : 'Apontar para Caixa Geral'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: GESTOR DE CONVITES E PRESENÇA (BLOCO 3) */}
          <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>👥 Convidados & Inscrições</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Controle de presenças e confirmações de bilheteria</span>
              </div>
              <button 
                onClick={() => setShowInviteModal(true)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                + Convidar
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              
              {/* PAINEL DE INSTRUÇÕES E CADASTRO DE NÚMERO (WhatsApp) */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.95)' }}>
                <h5 style={{ color: '#38bdf8', marginBottom: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ℹ️ Guia de Disparos e Antiban (WhatsApp)
                </h5>
                <p style={{ marginBottom: '8px', lineHeight: 1.3 }}>
                  <strong>Risco de Bloqueio (Spam):</strong> A Meta bloqueia números que disparam mensagens repetitivas para pessoas que não salvaram o contato da igreja. Recomenda-se disparar apenas para membros/visitantes que já possuem relacionamento com a comunidade.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>NÚMERO DE DISPARO DA IGREJA (WhatsApp Business API):</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="+55 (11) 99999-9999" 
                      defaultValue="+55 (11) 3333-1111"
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }} 
                    />
                    <button type="button" style={{ background: '#38bdf8', border: 'none', color: '#000', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                  💡 Para disparo em massa real (sem abrir abas extras), o sistema deve utilizar a API oficial da Meta configurada acima. O botão abaixo redirecionará pelo WhatsApp Web utilizando o número logado no dispositivo.
                </p>
              </div>

              {/* SELEÇÃO E FILTRO DE GRUPOS DE DISPARO */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🎯 Importar do Sistema por Grupo de Disparo:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('Louvor')}
                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎵 Louvor
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('Mídia')}
                    style={{ background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎥 Mídia
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('Obreiros')}
                    style={{ background: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6', border: '1px solid rgba(155, 89, 182, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🛡️ Obreiros
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('Infantil')}
                    style={{ background: 'rgba(253, 121, 168, 0.15)', color: '#fd79a8', border: '1px solid rgba(253, 121, 168, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🧸 Kids
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('Evangelismo')}
                    style={{ background: 'rgba(230, 126, 34, 0.15)', color: '#e67e22', border: '1px solid rgba(230, 126, 34, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🌍 Evangelismo
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('pastores')}
                    style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    ⛪ Pastores
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('visitantes')}
                    style={{ background: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', border: '1px solid rgba(241, 196, 15, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    👋 Visitantes
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleImportByMinistry('todos')}
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    👥 Todos
                  </button>
                </div>
              </div>
 
              {/* Botão WhatsApp Geral */}
              <button 
                onClick={handleMassSend}
                style={{ width: '100%', background: '#2ecc71', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                📢 Disparar Convites em Massa (WhatsApp)
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '10px' }}></div>

              {activeEventGuests.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Nenhum convidado adicionado a este evento ainda.
                </div>
              ) : (
                activeEventGuests.map(g => (
                  <div key={g.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{g.memberName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{g.memberPhone}</div>
                      {g.ticketPricePaid > 0 && (
                        <div style={{ fontSize: '0.65rem', color: '#2ecc71', marginTop: '2px', fontWeight: 'bold' }}>
                          Paid: {formatCurrency(g.ticketPricePaid)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <select 
                        value={g.status}
                        onChange={(e) => handleUpdateGuestStatus(g.id, e.target.value as any)}
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}>
                        <option value="pendente">Pendente</option>
                        <option value="confirmado_pago">Confirmado (Pago)</option>
                        <option value="confirmado_gratis">Confirmado (Gratuito)</option>
                        <option value="recusado">Recusado</option>
                      </select>

                      <button 
                        onClick={() => handleOpenWhatsAppConvite(g)}
                        title="Enviar convite específico"
                        style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        💬
                      </button>

                      <button 
                        onClick={() => handleDeleteGuest(g.id)}
                        title="Remover convidado"
                        style={{ background: 'transparent', border: 'none', color: '#e74c3c', fontSize: '1.2rem', cursor: 'pointer' }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nenhum evento ativo encontrado para esta igreja ou departamento.
        </div>
      )}

      {/* MODAL CRIAR EVENTO */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <form onSubmit={handleCreateEvent} className="glass" style={{ width: '100%', maxWidth: '720px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Criar Novo Evento</h4>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Título do Evento *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Banner/Foto do Convite</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={formData.bannerUrl || ''} 
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                      placeholder="URL da Imagem (ou faça upload ao lado) ->"
                    />
                    <label style={{ 
                      background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
                    }}>
                      📁 Upload
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, bannerUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link do Vídeo Teaser (Youtube)</label>
                  <input 
                    type="text" 
                    value={formData.videoUrl || ''} 
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    placeholder="Ex: https://youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Início *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.startTime} 
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Local</label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valor Inscrição (R$)</label>
                  <input 
                    type="number" 
                    value={formData.ticketPrice || 0} 
                    onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) || 0 })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link de Checkout Pagamento</label>
                  <input 
                    type="text" 
                    value={formData.paymentLink} 
                    onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                    placeholder="https://checkout.stripe.com/..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Orçamento Estimado Custo</label>
                  <input 
                    type="number" 
                    value={formData.estimatedCost || 0} 
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Descrição / Pauta</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                />
              </div>

            </div>

            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}>
                Criar Evento
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL INVITAR / REGISTRAR CONVIDADO */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <form onSubmit={handleAddGuest} className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Registrar Convidado / Inscrição</h4>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nome do Membro *</label>
                <input 
                  type="text" 
                  required
                  value={guestFormData.memberName} 
                  onChange={(e) => setGuestFormData({ ...guestFormData, memberName: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Telefone *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(11) 99999-9999"
                  value={guestFormData.memberPhone} 
                  onChange={(e) => setGuestFormData({ ...guestFormData, memberPhone: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status da Presença/Inscrição</label>
                <select 
                  value={guestFormData.status} 
                  onChange={(e) => setGuestFormData({ ...guestFormData, status: e.target.value as any })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                  <option value="pendente">Pendente</option>
                  <option value="confirmado_pago">Confirmado (Pago)</option>
                  <option value="confirmado_gratis">Confirmado (Gratuito)</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>

            </div>

            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}>
                Adicionar Convidado
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL COMPARTILHAR CONVITE WHATSAPP */}
      {showWaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>📢 Disparar Convite WhatsApp</h4>
              <button onClick={() => setShowWaModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Texto do convite gerado dinamicamente:</span>
              
              <textarea 
                value={waMsg} 
                onChange={(e) => setWaMsg(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', resize: 'vertical', minHeight: '180px', fontFamily: 'monospace' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowWaModal(false)}
                  style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button 
                  onClick={sendWhatsApp}
                  style={{ flex: 2, background: '#2ecc71', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  🚀 Enviar pelo WhatsApp
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SIMULAÇÃO DE DISPARO EM MASSA */}
      {massSendSimulation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)', textAlign: 'center', padding: '30px' }}>
            {massSendSimulation.status === 'sending' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="loading-spinner" style={{ width: '60px', height: '60px', border: '6px solid rgba(46, 204, 113, 0.2)', borderTop: '6px solid #2ecc71', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div>
                  <h4 style={{ fontSize: '1.25rem', margin: '0 0 5px 0', color: '#fff' }}>🚀 Disparando Convites em Massa...</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Enviando convites: <strong>{massSendSimulation.currentIndex}</strong> de <strong>{massSendSimulation.total}</strong> contatos
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(massSendSimulation.currentIndex / massSendSimulation.total) * 100}%`, height: '100%', background: '#2ecc71', transition: 'width 0.2s' }}></div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Aguarde, processando fila de envios via API de mensageria...
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '3.5rem', color: '#2ecc71' }}>✓</div>
                <div>
                  <h4 style={{ fontSize: '1.3rem', margin: '0 0 5px 0', color: '#2ecc71', fontWeight: 'bold' }}>Disparo em Massa Concluído!</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Todos os <strong>{massSendSimulation.total}</strong> contatos receberam o convite no WhatsApp.
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  💡 Para demonstração de teste real, abrimos o WhatsApp Web do primeiro convidado da fila.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
