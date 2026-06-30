"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Compartilhar() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'visitantes' | 'membros'>('visitantes');
  const [copiedV, setCopiedV] = useState(false);
  const [copiedM, setCopiedM] = useState(false);
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);

  // Carrega as igrejas apenas para Superadmins poderem filtrar de qual igreja querem copiar o link
  useEffect(() => {
    async function loadChurches() {
      if (currentUser?.role === 'superadmin' || currentUser?.role === 'pastor_diretor') {
        const { data } = await supabase.from('churches').select('id, name').eq('status', 'ativa');
        if (data) {
          setChurches(data);
          if (data.length > 0) {
            setSelectedChurchId(data[0].id);
          }
        }
      } else if (currentUser?.churchId) {
        setSelectedChurchId(currentUser.churchId);
      }
    }
    loadChurches();
  }, [currentUser]);

  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Constrói a URL final anexando o churchId
  const urlVisitante = selectedChurchId 
    ? `${base}/formulario?church=${selectedChurchId}` 
    : `${base}/formulario`;
    
  const urlMembro = selectedChurchId 
    ? `${base}/formulario-membro?church=${selectedChurchId}` 
    : `${base}/formulario-membro`;

  const qrVisitante = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(urlVisitante)}&bgcolor=ffffff&color=0f172a`;
  const qrMembro = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(urlMembro)}&bgcolor=ffffff&color=0f172a`;

  const copy = (url: string, type: 'v' | 'm') => {
    navigator.clipboard.writeText(url);
    if (type === 'v') { setCopiedV(true); setTimeout(() => setCopiedV(false), 2500); }
    else { setCopiedM(true); setTimeout(() => setCopiedM(false), 2500); }
  };

  const Section = ({ title, icon, url, qr, copied, type, color, desc, tips }: any) => (
    <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
      {/* QR Code */}
      <div className="glass" style={{ flex: 1, minWidth: '300px', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem' }}>📱 QR Code — {title}</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '280px' }}>{desc}</p>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
          <img src={qr} alt={`QR Code ${title}`} style={{ display: 'block', width: '240px', height: '240px' }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>ChurchFlow — {title}</p>
        <button className="modal-btn" style={{ margin: 0, fontSize: '0.85rem' }} onClick={() => { const a = document.createElement('a'); a.href = qr; a.download = `churchflow-qr-${type}.png`; a.click(); }}>
          ⬇️ Baixar QR Code
        </button>
      </div>

      {/* Link + Dicas */}
      <div className="glass" style={{ flex: 1, minWidth: '300px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem' }}>🔗 Link Compartilhável</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid var(--card-border)', wordBreak: 'break-all' }}>
          <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: '600' }}>{url}</span>
          <button onClick={() => copy(url, type)} style={{ background: copied ? '#2ecc71' : 'var(--primary-color)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', whiteSpace: 'nowrap', transition: 'background 0.2s' }}>
            {copied ? '✅ Copiado!' : '📋 Copiar'}
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--table-border)', margin: '3px 0' }} />

        <h4 style={{ color: 'var(--primary-light)', fontSize: '0.95rem' }}>💡 Dicas de Uso</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '2', paddingLeft: '18px' }}>
          {tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>

        <a href={url} target="_blank" className="modal-btn" style={{ margin: 0, fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', display: 'block', backgroundColor: color }}>
          👁️ Visualizar Formulário
        </a>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', marginBottom: '5px' }}>🔗 Links e QR Codes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Compartilhe formulários de cadastro para visitantes e membros.</p>
        </div>

        {/* Seletor de igreja apenas para Superadmins/Master */}
        {(currentUser?.role === 'superadmin' || currentUser?.role === 'pastor_diretor') && churches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Congregação:</label>
            <select 
              value={selectedChurchId} 
              onChange={e => setSelectedChurchId(e.target.value)} 
              className="search-input glass-input"
              style={{ padding: '8px 12px', minWidth: '180px' }}
            >
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        <button onClick={() => setTab('visitantes')} style={{
          padding: '10px 22px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif",
          background: tab === 'visitantes' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', color: tab === 'visitantes' ? '#fff' : 'var(--text-secondary)',
          transition: 'all 0.2s'
        }}>👋 Visitantes</button>
        <button onClick={() => setTab('membros')} style={{
          padding: '10px 22px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif",
          background: tab === 'membros' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', color: tab === 'membros' ? '#fff' : 'var(--text-secondary)',
          transition: 'all 0.2s'
        }}>📋 Membros</button>
      </div>

      <div className="scroll-container">
        {tab === 'visitantes' ? (
          <Section
            title="Ficha de Visitante"
            icon="👋"
            url={urlVisitante}
            qr={qrVisitante}
            copied={copiedV}
            type="v"
            color="#f39c12"
            desc="Imprima este QR Code e coloque na entrada da igreja. O visitante escaneia e preenche a ficha."
            tips={[
              'Imprima em banners na entrada da igreja',
              'Cole nas mesas de recepção',
              'Compartilhe nos stories do Instagram',
              'Envie pelo grupo de WhatsApp dos líderes',
              'Use em slides durante os avisos do culto'
            ]}
          />
        ) : (
          <Section
            title="Cadastro de Membro"
            icon="📋"
            url={urlMembro}
            qr={qrMembro}
            copied={copiedM}
            type="m"
            color="#3b82f6"
            desc="Compartilhe para novos membros se cadastrarem. O cadastro fica pendente até aprovação da secretaria."
            tips={[
              'Envie para novos convertidos que querem se tornar membros',
              'Compartilhe em células e pequenos grupos',
              'Inclua no material de boas-vindas da igreja',
              'Use em turmas de batismo e integração',
              'Poste no site oficial da igreja'
            ]}
          />
        )}
      </div>
    </div>
  );
}
