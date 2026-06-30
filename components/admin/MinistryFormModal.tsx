"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MinistryFormModalProps {
  onClose: () => void;
  onSave: (ministry: any) => void;
}

export function MinistryFormModal({ onClose, onSave }: MinistryFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    director_pastor_name: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.from('ministries').insert([
      {
        name: formData.name,
        director_pastor_name: formData.director_pastor_name
      }
    ]).select();

    setLoading(false);

    if (error) {
      alert('Erro ao criar Rede: ' + error.message);
    } else if (data && data.length > 0) {
      onSave(data[0]);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '16px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>Criar Nova Rede</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cadastre um Ministério para agrupar Igrejas</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">Nome da Rede (Ministério)</label>
            <input 
              required 
              type="text" 
              className="search-input glass-input" 
              placeholder="Ex: Rede Batista Independente"
              style={{ width: '100%' }} 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div>
            <label className="input-label">Pastor Diretor (Responsável pela Rede)</label>
            <input 
              required 
              type="text" 
              className="search-input glass-input" 
              placeholder="Ex: Pr. João Silva"
              style={{ width: '100%' }} 
              value={formData.director_pastor_name} 
              onChange={e => setFormData({...formData, director_pastor_name: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Salvando...' : 'Salvar Rede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
