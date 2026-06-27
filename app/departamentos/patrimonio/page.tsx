"use client";

import React from 'react';

export default function PatrimonioDashboardPage() {
  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '20px', paddingBottom: '20px' }}>
      <div className="header" style={{ marginBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#e67e22', margin: 0 }}>🪑 Gestão de Patrimônio</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Controle de bens, equipamentos e estrutura física</span>
        </div>
      </div>

      <div className="glass" style={{ padding: '40px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Em breve... O módulo de inventário e gestão de bens será construído aqui.
      </div>
    </div>
  );
}
