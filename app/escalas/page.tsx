"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Escalas() {
  const [selectedService, setSelectedService] = useState('Culto de Domingo - 18h');
  const [selectedDate, setSelectedDate] = useState('2026-05-24');
  
  const [dbMembers, setDbMembers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase.from('members').select('*');
      if (data) {
        setDbMembers(data.map(m => ({
          id: m.id,
          name: m.name,
          ministry: m.ministry,
          function: m.function,
          photoUrl: m.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`
        })));
      }
    }
    fetchMembers();
  }, []);

  // Filtrar apenas membros do Louvor e Mídia como exemplo para escalas
  const availableMembers = dbMembers.filter(m => m.ministry === 'Louvor' || m.ministry === 'Mídia');

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '5px' }}>Gestão de Escalas</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Monte a equipe de Louvor e Mídia para os cultos.</p>
        </div>
        <button className="modal-btn" style={{ marginTop: 0 }}>+ Nova Escala</button>
      </div>
      
      <div className="scroll-container">
        <div className="glass" style={{ padding: '25px', marginBottom: '25px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Culto / Evento</label>
              <select className="search-input glass-input" style={{ width: '100%' }} value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                <option value="Culto de Domingo - 18h">Culto de Domingo - 18h</option>
                <option value="Culto de Ensino - 20h">Culto de Ensino - Terça 20h</option>
                <option value="Rede de Jovens">Rede de Jovens - Sábado 19h</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Data</label>
              <input type="date" className="search-input glass-input" style={{ width: '100%' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
          </div>
        </div>

        <h4 style={{ marginBottom: '15px', color: 'var(--primary-light)' }}>Equipe Disponível (Louvor & Mídia)</h4>
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {availableMembers.map(member => (
            <div key={member.id} className="glass member-card" style={{ padding: '15px', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <img src={member.photoUrl} alt={member.name} className="member-photo-small" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
              <h4 style={{ fontSize: '1rem', marginBottom: '5px' }}>{member.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{member.function}</p>
              <button style={{
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                width: '100%'
              }}>
                Escalar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
