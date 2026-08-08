"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useChurches } from '@/hooks/useChurches';
import { ChevronLeft, Cake, CalendarHeart, Gift } from 'lucide-react';

export default function AniversariantesPage() {
  const { currentUser, canSeeAllChurches, activeChurchId, activeMinistryId } = useAuth();
  const [churchF, setChurchF] = useState(activeChurchId ? activeChurchId : (canSeeAllChurches ? 'ALL' : currentUser?.churchId || ''));

  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const openWhatsApp = (name: string, phone: string, churchName: string) => {
    if (!phone) {
      alert('Este membro não possui telefone cadastrado no sistema.');
      return;
    }
    
    const hour = new Date().getHours();
    let greeting = 'Bom dia';
    if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
    else if (hour >= 18) greeting = 'Boa noite';
    
    const firstName = name.split(' ')[0];
    const msg = `${greeting}, ${firstName}! 🎉🎂\n\nEm nome de toda a nossa igreja ${churchName}, queremos te desejar um feliz aniversário! Que Deus continue abençoando sua vida, te dando muita saúde, paz e alegria. Amamos a sua vida! 🙌`;

    setWhatsappMessage(msg);
    setWhatsappPhone(phone.replace(/\D/g, ''));
    setShowWhatsappModal(true);
  };

  const sendWhatsApp = () => {
    if (!whatsappPhone) return;
    const url = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
    setShowWhatsappModal(false);
  };

  // Sincronizar filtro de igreja com activeChurchId
  useEffect(() => {
    if (activeChurchId) {
      setChurchF(activeChurchId);
    } else if (!canSeeAllChurches && currentUser?.churchId) {
      setChurchF(currentUser.churchId);
    }
  }, [activeChurchId, canSeeAllChurches, currentUser]);
  
  const { churches: dbChurches } = useChurches(activeMinistryId);
  const scopedChurchIds = useMemo(() => dbChurches.map(c => c.id), [dbChurches]);
  const { members: allMembers, loading } = useMembers(undefined, scopedChurchIds);
  // Filtra por igreja selecionada na hierarquia
  const filteredMembers = useMemo(() => {
    return allMembers.filter(m => {
      if (churchF !== 'ALL' && m.church_id !== churchF) return false;
      if (m.status === 'inativo') return false; // Inclui ativos, visitantes, em_conversao
      // Vamos incluir membros, em conversão, visitantes, desde que tenham data
      if (!m.birthDate) return false;
      return true;
    });
  }, [allMembers, churchF]);

  const { todayBirthdays, monthBirthdays } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    const todayList: typeof allMembers = [];
    const monthList: typeof allMembers = [];

    filteredMembers.forEach(m => {
      if (!m.birthDate) return;
      
      const parts = m.birthDate.split('-');
      if (parts.length === 3) {
        // Formato YYYY-MM-DD
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);

        if (month === currentMonth && day === currentDay) {
          todayList.push(m);
        } else if (month === currentMonth) {
          monthList.push(m);
        }
      }
    });

    // Ordenar do mês pelo dia
    monthList.sort((a, b) => {
      const dayA = parseInt(a.birthDate!.split('-')[2], 10);
      const dayB = parseInt(b.birthDate!.split('-')[2], 10);
      return dayA - dayB;
    });

    return { todayBirthdays: todayList, monthBirthdays: monthList };
  }, [filteredMembers]);

  const getChurchName = (cId: string) => {
    const c = dbChurches.find(x => x.id === cId);
    return c ? c.name : 'Desconhecida';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/dashboard-secretaria" style={{
            display: 'flex', alignItems: 'center', gap: '8px', 
            textDecoration: 'none', color: 'var(--text-secondary)',
            padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ChevronLeft size={18} />
            <span>Voltar</span>
          </Link>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cake size={28} color="#f1c40f" />
            Aniversariantes
          </h1>
        </div>

        {canSeeAllChurches && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filtro de Igreja:</span>
            <select
              value={churchF}
              onChange={e => setChurchF(e.target.value)}
              className="glass-input"
              style={{ padding: '8px 12px', minWidth: '200px' }}
            >
              <option value="ALL">Todas as Igrejas/Rede</option>
              {dbChurches.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* SECTION: HOJE */}
        <div className="glass" style={{ padding: '25px', borderRadius: '16px', borderLeft: '5px solid #f1c40f' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#f1c40f' }}>
            <Gift size={24} />
            Aniversariantes do Dia
          </h2>
          
          {todayBirthdays.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: '10px 0 0 0' }}>Nenhum aniversariante hoje.</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {todayBirthdays.map(m => (
                <div key={m.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(241, 196, 15, 0.3)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden',
                    background: '#2c3e50', flexShrink: 0
                  }}>
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        {m.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {m.function || m.status}
                    </div>
                    {canSeeAllChurches && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                        {getChurchName(m.church_id)}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={e => { e.stopPropagation(); openWhatsApp(m.name, m.phone || '', getChurchName(m.church_id)); }} 
                    style={{ width:'28px', height:'28px', borderRadius:'50%', border:'1.5px solid #25d366', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', marginLeft: 'auto' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#25d366'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#25d366'; }}
                    title="Enviar Parabéns pelo WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: MÊS */}
        <div className="glass" style={{ padding: '25px', borderRadius: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: 'var(--text-primary)' }}>
            <CalendarHeart size={24} color="#3498db" />
            Aniversariantes do Mês
          </h2>
          
          {monthBirthdays.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: '10px 0 0 0' }}>Nenhum aniversariante no restante do mês.</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {monthBirthdays.map(m => {
                const day = m.birthDate!.split('-')[2];
                return (
                  <div key={m.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(52, 152, 219, 0.3)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <div style={{
                      width: '45px', height: '45px', borderRadius: '8px', 
                      background: 'rgba(52, 152, 219, 0.1)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(52, 152, 219, 0.3)',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1 }}>Dia</span>
                      <strong style={{ fontSize: '1.1rem', color: '#3498db', lineHeight: 1, marginTop: '2px' }}>{day}</strong>
                    </div>
                    
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden',
                      background: '#2c3e50', flexShrink: 0
                    }}>
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
                          {m.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {m.function || m.status}
                      </div>
                      {canSeeAllChurches && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {getChurchName(m.church_id)}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={e => { e.stopPropagation(); openWhatsApp(m.name, m.phone || '', getChurchName(m.church_id)); }} 
                      style={{ width:'26px', height:'26px', borderRadius:'50%', border:'1.5px solid #25d366', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', marginLeft: 'auto' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#25d366'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#25d366'; }}
                      title="Enviar Parabéns pelo WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      
      {/* WHATSAPP MODAL */}
      {showWhatsappModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowWhatsappModal(false)}>
          <div style={{ background: '#1a1a2e', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#25d366', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>Mensagem WhatsApp</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Você pode editar a mensagem de aniversário antes de enviar:</p>
            <textarea
              value={whatsappMessage}
              onChange={e => setWhatsappMessage(e.target.value)}
              className="search-input glass-input"
              style={{ width: '100%', height: '150px', padding: '12px', boxSizing: 'border-box', resize: 'none', marginBottom: '20px', lineHeight: '1.5' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowWhatsappModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={sendWhatsApp} style={{ background: '#25d366', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
