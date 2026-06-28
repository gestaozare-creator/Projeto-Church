"use client";

import { Church } from '@/types/database';

interface DatabaseUsage {
  members: number;
  transactions: number;
  files: number;
  activeUsers: number;
  totalSizeMB: string;
  infraPlan: string;
  totalCostUSD: string;
}

interface ChurchCardProps {
  church: Church & { 
    isHeadquarters?: boolean;
    plan?: string;
    subscriptionStatus?: string;
    pastorName?: string;
    departments?: string[];
  };
  usage: DatabaseUsage;
  ministryName: string;
  onEdit: (church: any) => void;
  viewMode: 'grid' | 'list';
}

export function ChurchCard({ church, usage, ministryName, onEdit, viewMode }: ChurchCardProps) {
  if (viewMode === 'list') {
    return (
      <div 
        className="glass" 
        style={{ 
          borderRadius: '12px', 
          padding: '12px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '15px', 
          border: `1px solid ${church.status === 'inativa' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)'}`, 
          opacity: church.status === 'inativa' ? 0.6 : 1,
          flexWrap: 'wrap'
        }}
      >
        {/* Logo e Nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 auto' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: church.primaryColor || '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
            {church.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {church.name}
              {church.isHeadquarters && <span style={{ fontSize: '0.65rem', background: '#3498db', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>SEDE</span>}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {ministryName}
            </span>
          </div>
        </div>

        {/* Pastor e Localização */}
        <div style={{ minWidth: '150px', flex: '1 1 auto' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Pastor:</strong> {church.pastorName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📍 {church.city} ({church.state})</div>
        </div>

        {/* Dados de Uso e Infra */}
        <div style={{ minWidth: '130px', flex: '1 1 auto' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Banco:</strong> {usage.totalSizeMB} MB</div>
          <span style={{ fontSize: '0.65rem', background: usage.infraPlan === 'Gratuito' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)', color: usage.infraPlan === 'Gratuito' ? '#2ecc71' : '#e74c3c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', marginTop: '2px' }}>
            {usage.infraPlan.toUpperCase()} (${usage.totalCostUSD}/mês)
          </span>
        </div>

        {/* Plano e Status Assinatura */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            {church.plan?.toUpperCase() || 'BASIC'}
          </span>
          <span style={{ 
            background: church.subscriptionStatus === 'Ativa' ? 'rgba(46, 204, 113, 0.15)' : church.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)', 
            color: church.subscriptionStatus === 'Ativa' ? '#2ecc71' : church.subscriptionStatus === 'Inadimplente' ? '#e74c3c' : '#f1c40f',
            padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' 
          }}>
            {church.subscriptionStatus?.toUpperCase() || 'TRIAL'}
          </span>
        </div>

        {/* Ação */}
        <div>
          <button 
            onClick={() => onEdit(church)} 
            style={{ 
              background: 'rgba(52, 152, 219, 0.15)', 
              color: '#3498db', 
              border: '1px solid rgba(52, 152, 219, 0.2)', 
              padding: '6px 14px', 
              borderRadius: '6px', 
              fontSize: '0.78rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onMouseEnter={e => {
              e.currentTarget.style.background='#3498db';
              e.currentTarget.style.color='#fff';
            }} 
            onMouseLeave={e => {
              e.currentTarget.style.background='rgba(52, 152, 219, 0.15)';
              e.currentTarget.style.color='#3498db';
            }}
          >
            ⚙️ Gerenciar
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode
  return (
    <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: `1px solid ${church.status === 'inativa' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`, opacity: church.status === 'inativa' ? 0.6 : 1 }}>
      
      {/* Cabeçalho da Igreja com Capa */}
      <div style={{ height: '85px', background: church.coverPhotoUrl ? `url(${church.coverPhotoUrl}) center/cover` : `linear-gradient(135deg, ${church.primaryColor || '#3498db'}, ${church.secondaryColor || '#2c3e50'})`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
          <span style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
            {church.plan?.toUpperCase() || 'BASIC'}
          </span>
          <span style={{ 
            background: church.subscriptionStatus === 'Ativa' ? 'rgba(46, 204, 113, 0.8)' : church.subscriptionStatus === 'Inadimplente' ? 'rgba(231, 76, 60, 0.8)' : 'rgba(241, 196, 15, 0.8)', 
            padding: '4px 8px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 'bold', color: '#fff'
          }}>
            {church.subscriptionStatus?.toUpperCase() || 'TRIAL'}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginTop: '-20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: church.primaryColor || '#3498db', border: '3px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', zIndex: 2 }}>
            {church.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', lineHeight: 1.2 }}>{church.name}</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: '2px' }}>
              {ministryName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: church.isHeadquarters ? '#3498db' : 'var(--text-secondary)', fontWeight: 'bold' }}>
              {church.isHeadquarters ? '★ SEDE' : 'FILIAL'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              📍 {church.city} - {church.neighborhood || 'Centro'}
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Pastor:</strong> {church.pastorName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>Banco de Dados:</strong> {usage.totalSizeMB} MB</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
          {church.departments?.slice(0, 4).map((d: string) => (
            <span key={d} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{d}</span>
          ))}
          {church.departments && church.departments.length > 4 && <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>+{church.departments.length - 4}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <button onClick={() => onEdit(church)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(52, 152, 219, 0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>⚙️ Gerenciar Tenant</button>
      </div>
    </div>
  );
}
