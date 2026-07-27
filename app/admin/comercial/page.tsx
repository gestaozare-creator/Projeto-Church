"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminComercialPage() {
  const { canManageSystem, currentUser } = useAuth();
  
  const [config, setConfig] = useState({
    planSecretaria: 97,
    planFinanceiro: 97,
    planKids: 47,
    planCombo: 197,
    whatsappPhone: '5541999999999',
    promoBanner: '⚡ Condição Especial de Lançamento: Ganhe 30% de Desconto no Plano Combo Completo!'
  });
  
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('project_church_landing_config');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch(e) {}
  }, []);

  if (!canManageSystem && currentUser?.role !== 'superadmin') {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', color: '#e74c3c' }}>
        <h2>🚫 Acesso Restrito ao Administrador Master</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Esta página de gestão comercial e precificação do Projeto Church é exclusiva do proprietário da plataforma.</p>
      </div>
    );
  }

  const handleSaveConfig = () => {
    localStorage.setItem('project_church_landing_config', JSON.stringify(config));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>👑 Gestão Comercial & Precificação (Projeto Church)</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Painel exclusivo do Dono da Plataforma para definir preços dos módulos e ofertas da Landing Page pública.
          </p>
        </div>
        <a href="/vendas" target="_blank" rel="noreferrer" className="modal-btn" style={{ background: '#6366f1', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.88rem' }}>
          👁️ Ver Página de Vendas (/vendas)
        </a>
      </div>

      <div className="glass" style={{ padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>🏷️ Valores dos Módulos Comerciais</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="glass" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Plano Secretaria (R$/mês)</label>
            <input 
              type="number" 
              value={config.planSecretaria} 
              onChange={e => setConfig(p => ({ ...p, planSecretaria: Number(e.target.value) }))} 
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }} 
            />
          </div>

          <div className="glass" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Plano Financeiro (R$/mês)</label>
            <input 
              type="number" 
              value={config.planFinanceiro} 
              onChange={e => setConfig(p => ({ ...p, planFinanceiro: Number(e.target.value) }))} 
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71' }} 
            />
          </div>

          <div className="glass" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Plano Kids (R$/mês)</label>
            <input 
              type="number" 
              value={config.planKids} 
              onChange={e => setConfig(p => ({ ...p, planKids: Number(e.target.value) }))} 
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: '#f1c40f' }} 
            />
          </div>

          <div className="glass" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid #6366f1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', display: 'block', marginBottom: '8px' }}>Plano Combo Completo (R$/mês)</label>
            <input 
              type="number" 
              value={config.planCombo} 
              onChange={e => setConfig(p => ({ ...p, planCombo: Number(e.target.value) }))} 
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: '#a5b4fc' }} 
            />
          </div>
        </div>

        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>💬 Canais de Vendas & Anúncios</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>WhatsApp Comercial (DDD + Número)</label>
            <input 
              type="text" 
              value={config.whatsappPhone} 
              onChange={e => setConfig(p => ({ ...p, whatsappPhone: e.target.value }))} 
              placeholder="5541999999999"
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Banner Promocional (Topo da Landing Page)</label>
            <input 
              type="text" 
              value={config.promoBanner} 
              onChange={e => setConfig(p => ({ ...p, promoBanner: e.target.value }))} 
              placeholder="Digite a chamada em destaque..."
              className="search-input glass-input" 
              style={{ width: '100%', padding: '12px' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={handleSaveConfig} style={{ padding: '14px 28px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(46,204,113,0.3)' }}>
            💾 Salvar Alterações Comerciais
          </button>

          {savedMsg && (
            <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.9rem' }}>
              ✅ Preços e configurações salvos com sucesso!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
