"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useChurches } from '@/hooks/useChurches';
import { ChevronLeft, Cake, CalendarHeart, Gift } from 'lucide-react';

export default function AniversariantesPage() {
  const { currentUser, canSeeAllChurches } = useAuth();
  const [churchF, setChurchF] = useState(canSeeAllChurches ? 'ALL' : (currentUser?.churchId || ''));
  
  const { churches: dbChurches } = useChurches();
  const { members: allMembers, loading } = useMembers();

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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {monthBirthdays.map(m => {
                const day = m.birthDate!.split('-')[2];
                return (
                  <div key={m.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '12px',
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
