"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import './relatorios.css'; // Let's create this file next

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MonthlyData {
  monthIndex: number;
  newMembers: number;
  newVisitors: number;
  income: number;
  expense: number;
}

export default function RelatoriosPage() {
  const { currentUser, activeChurchId, canSeeAllChurches } = useAuth();
  const router = useRouter();

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifica permissão
  const isAllowed = currentUser && ['superadmin', 'pastor_diretor', 'admin', 'financeiro'].includes(currentUser.role);

  useEffect(() => {
    if (!currentUser) return;
    if (!isAllowed) {
      return; // Será renderizado o bloqueio abaixo
    }

    const churchToFetch = activeChurchId || (canSeeAllChurches ? '1' : currentUser.churchId);

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-relatorios-data?churchId=${churchToFetch}&year=${year}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          console.error(result.error);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, [year, currentUser, activeChurchId, canSeeAllChurches, isAllowed]);

  if (!currentUser) return null;

  if (!isAllowed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }} className="fade-in">
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🔒</div>
        <h2 style={{ color: '#e74c3c' }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Seu perfil não possui acesso a este módulo de relatórios.</p>
        <button onClick={() => router.push('/')} className="glass-button" style={{ marginTop: '20px' }}>Voltar ao Início</button>
      </div>
    );
  }

  const handlePrint = (monthIndex: number) => {
    const printContents = document.getElementById(`print-month-${monthIndex}`)?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      document.body.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif;">
          <h1 style="text-align: center; margin-bottom: 30px;">Relatório Mensal - ${monthNames[monthIndex]} ${year}</h1>
          ${printContents}
        </div>
      `;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // To restore React event listeners
    }
  };

  const handleWhatsApp = (month: MonthlyData) => {
    const balance = month.income - month.expense;
    const isPositive = balance >= 0;
    
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const text = `*RELATÓRIO MENSAL - ${monthNames[month.monthIndex].toUpperCase()} ${year}* 📊

*Crescimento da Igreja* 📈
👥 Novos Membros: ${month.newMembers}
👋 Novos Visitantes: ${month.newVisitors}

*Resumo Financeiro* 💰
🟢 Entradas: ${formatCurrency(month.income)}
🔴 Saídas: ${formatCurrency(month.expense)}
${isPositive ? '🔵 Saldo Positivo:' : '🔴 Saldo Negativo:'} ${formatCurrency(balance)}

Gerado pelo _Projeto Church_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>📄 Relatórios Consolidados</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Acompanhe o crescimento de almas e o panorama financeiro de cada mês.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Ano de Referência:</label>
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))}
            className="glass-input"
            style={{ padding: '10px', borderRadius: '8px', minWidth: '100px' }}
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Carregando relatórios...</div>
      ) : (
        <div className="reports-grid">
          {data.map((month) => {
            const balance = month.income - month.expense;
            const hasData = month.newMembers > 0 || month.newVisitors > 0 || month.income > 0 || month.expense > 0;

            return (
              <div key={month.monthIndex} className={`report-card glass ${!hasData ? 'empty' : ''}`}>
                <div className="report-header">
                  <h3>{monthNames[month.monthIndex]}</h3>
                  <div className="report-actions">
                    <button onClick={() => handlePrint(month.monthIndex)} title="Gerar PDF (Imprimir)">🖨️ PDF</button>
                    <button onClick={() => handleWhatsApp(month)} title="Enviar WhatsApp">💬 WhatsApp</button>
                  </div>
                </div>

                <div id={`print-month-${month.monthIndex}`} className="report-body">
                  <div className="report-section">
                    <h4>🔥 Crescimento de Almas</h4>
                    <div className="report-stat-grid">
                      <div className="report-stat">
                        <span className="stat-label">Novos Membros</span>
                        <span className="stat-value highlight-blue">+{month.newMembers}</span>
                      </div>
                      <div className="report-stat">
                        <span className="stat-label">Novos Visitantes</span>
                        <span className="stat-value highlight-orange">+{month.newVisitors}</span>
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h4>💰 Panorama Financeiro</h4>
                    <div className="report-stat-grid">
                      <div className="report-stat">
                        <span className="stat-label">Entradas</span>
                        <span className="stat-value text-green">{month.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      <div className="report-stat">
                        <span className="stat-label">Saídas</span>
                        <span className="stat-value text-red">{month.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>
                    <div className="report-balance" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                      <span className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Saldo do Mês</span>
                      <span className={`stat-value ${balance >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '1.5rem' }}>
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
