"use client";

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

type Person = {
  id: string; name: string; phone?: string; address?: string;
  state?: string; type: 'membro' | 'visitante'; photoUrl?: string;
  churchId?: string; status?: string;
};

export default function Mapeamento() {
  const { currentUser, canSeeAllChurches, activeChurchId } = useAuth();
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [dbChurches, setDbChurches] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    async function fetchData() {
      let allMembers: any[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data: pageData } = await supabase.from('members').select('*').range(page * pageSize, (page + 1) * pageSize - 1);
        if (!pageData || pageData.length === 0) break;
        allMembers = [...allMembers, ...pageData];
        if (pageData.length < pageSize) break;
        page++;
      }
      setDbMembers(allMembers);
      const { data: churchesData } = await supabase.from('churches').select('*');
      if (churchesData) setDbChurches(churchesData);
    }
    fetchData();
  }, []);

  // Igreja ativa (contexto de visão)
  const activeChurch = useMemo(() => {
    const churchId = activeChurchId || currentUser?.churchId;
    return dbChurches.find(c => c.id === churchId) || dbChurches[0];
  }, [dbChurches, activeChurchId, currentUser]);

  // Membros e visitantes da igreja ativa
  const allPeople: Person[] = useMemo(() => {
    if (!activeChurch) return [];
    return dbMembers
      .filter(m => m.church_id === activeChurch.id)
      .map(m => ({
        id: m.id, name: m.name, phone: m.phone, address: m.address,
        state: m.state, type: (m.status === 'visitante' || m.status === 'em_conversao' ? 'visitante' : 'membro') as 'visitante' | 'membro',
        photoUrl: m.photoUrl, churchId: m.church_id, status: m.status,
      }));
  }, [dbMembers, activeChurch]);

  const [filter, setFilter] = useState<'todos' | 'membro' | 'visitante'>('todos');
  const [showAllBairros, setShowAllBairros] = useState(false);

  const filteredPeople = useMemo(() => {
    if (filter === 'todos') return allPeople;
    return allPeople.filter(p => p.type === filter);
  }, [allPeople, filter]);

  // Endereço exibido no mapa
  const churchAddress = activeChurch?.address || activeChurch?.city
    ? `${activeChurch?.neighborhood || ''}, ${activeChurch?.city || ''}, ${activeChurch?.state || ''}, Brasil`.replace(/^,\s*/, '')
    : 'São Paulo, SP, Brasil';

  const geocache = useMemo(() => {
    if (!activeChurch) return {};
    try {
      const config = typeof activeChurch.config === 'string' ? JSON.parse(activeChurch.config) : (activeChurch.config || {});
      return config.geocache || {};
    } catch(e) {
      return {};
    }
  }, [activeChurch]);

  const totalMembros = allPeople.filter(p => p.type === 'membro').length;
  const totalVisitantes = allPeople.filter(p => p.type === 'visitante').length;
  const comEndereco = filteredPeople.filter(p => p.address).length;

  // Distribuição por bairro
  const byBairro = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPeople.forEach(p => {
      const parts = (p.address || '').split(',').map(s => s.trim());
      const bairro = parts[0] || 'Não informado';
      counts[bairro] = (counts[bairro] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredPeople]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 Mapeamento Local
            {activeChurch && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                — {activeChurch.name}
              </span>
            )}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Localização da igreja e endereços de membros e visitantes
          </p>
        </div>
        {/* Filtro */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['todos', 'membro', 'visitante'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setSelectedPerson(null); }} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: filter === f ? (f === 'membro' ? '#3498db' : f === 'visitante' ? '#f39c12' : 'var(--primary-color)') : 'rgba(255,255,255,0.06)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s'
            }}>
              {f === 'todos' ? 'Todos' : f === 'membro' ? '🔵 Membros' : '🟡 Visitantes'}
            </button>
          ))}
        </div>
      </div>

      {/* STATS RÁPIDOS */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Membros', value: totalMembros, color: '#3498db' },
          { label: 'Visitantes', value: totalVisitantes, color: '#f39c12' },
          { label: 'Com endereço', value: comEndereco, color: '#2ecc71' },
          { label: 'Sem endereço', value: filteredPeople.length - comEndereco, color: '#e74c3c' },
        ].map(s => (
          <div key={s.label} className="glass" style={{
            padding: '10px 16px', borderRadius: '10px', textAlign: 'center',
            border: `1px solid ${s.color}33`, minWidth: '80px'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CORPO PRINCIPAL: Mapa + Lista */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* MAPA GOOGLE */}
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '400px' }}>
          <LeafletMap 
            people={filteredPeople} 
            church={{ name: activeChurch?.name, address: churchAddress }} 
            selectedPerson={selectedPerson} 
            geocache={geocache} 
          />
          {selectedPerson && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
              borderRadius: '10px', padding: '10px 14px', maxWidth: '260px',
              border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.78rem'
            }}>
              <div style={{ fontWeight: 700, color: selectedPerson.type === 'membro' ? '#3498db' : '#f39c12' }}>
                {selectedPerson.type === 'membro' ? '🔵' : '🟡'} {selectedPerson.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: '4px', lineHeight: 1.4 }}>
                📍 {selectedPerson.address}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontSize: '0.7rem' }}>
                Rota a partir da sede da {activeChurch?.name}
              </div>
              <button onClick={() => setSelectedPerson(null)} style={{
                marginTop: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer'
              }}>✕ Fechar rota</button>
            </div>
          )}
          {!selectedPerson && activeChurch && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              borderRadius: '10px', padding: '8px 12px',
              border: '1px solid rgba(52,152,219,0.3)', fontSize: '0.76rem', color: '#fff'
            }}>
              ⛪ <strong>{activeChurch.name}</strong>
              {activeChurch.address && (
                <div style={{ color: 'rgba(255,255,255,0.55)', marginTop: '2px', fontSize: '0.7rem' }}>
                  {activeChurch.address}
                </div>
              )}
              <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '3px', fontSize: '0.68rem' }}>
                Clique em um membro para ver a rota
              </div>
            </div>
          )}
        </div>

        {/* PAINEL LATERAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          {/* Lista de pessoas */}
          <div className="glass" style={{ borderRadius: '14px', padding: '14px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
              {filter === 'todos' ? 'Membros & Visitantes' : filter === 'membro' ? 'Membros' : 'Visitantes'} com endereço
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredPeople.filter(p => p.address).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', padding: '20px' }}>
                  Nenhum endereço cadastrado
                </div>
              ) : (
                filteredPeople.filter(p => p.address).map(p => (
                  <button key={p.id} onClick={() => setSelectedPerson(selectedPerson?.id === p.id ? null : p)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px',
                    borderRadius: '8px', border: `1px solid ${selectedPerson?.id === p.id ? (p.type === 'membro' ? 'rgba(52,152,219,0.5)' : 'rgba(241,196,15,0.5)') : 'rgba(255,255,255,0.06)'}`,
                    background: selectedPerson?.id === p.id ? (p.type === 'membro' ? 'rgba(52,152,219,0.15)' : 'rgba(241,196,15,0.1)') : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                  }}>
                    <span style={{ fontSize: '0.75rem', marginTop: '1px' }}>{p.type === 'membro' ? '🔵' : '🟡'}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{p.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>{p.address}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Top bairros */}
          {byBairro.length > 0 && (
            <div className="glass" style={{ borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', maxHeight: showAllBairros ? '400px' : 'auto', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Top Bairros
                </div>
                {byBairro.length > 6 && (
                  <button 
                    onClick={() => setShowAllBairros(!showAllBairros)}
                    style={{ background: 'transparent', border: 'none', color: '#3498db', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {showAllBairros ? 'Ver menos' : 'Ver todos'}
                  </button>
                )}
              </div>
              <div style={{ overflowY: showAllBairros ? 'auto' : 'hidden', flex: 1, paddingRight: showAllBairros ? '4px' : '0' }}>
                {byBairro.slice(0, showAllBairros ? undefined : 6).map(([bairro, count]) => {
                  const max = byBairro[0][1];
                  return (
                    <div key={bairro} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>{bairro}</span>
                        <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
                        <div style={{ height: '100%', borderRadius: '2px', width: `${(count / max) * 100}%`, background: 'linear-gradient(90deg, #3498db, #9b59b6)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
