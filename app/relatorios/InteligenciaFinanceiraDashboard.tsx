"use client";

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface ChurchData {
  id: string;
  name: string;
  logo: string;
  receitaAtual: number;
  despesaAtual: number;
  saldoAtual: number;
  receitaAnterior: number;
  entradasCount: number;
  ticketMedio: number;
  contasVencidas: number;
  contasVencidasValor: number;
  contasAPagar: number;
  contasAPagarValor: number;
  cultos: { name: string; value: number }[];
}

interface GlobalData {
  receita: number;
  despesa: number;
  saldo: number;
  receitaPrev: number;
  growth: number;
  ticketMedio: number;
}

interface HistoryData {
  name: string;
  receitas: number;
  despesas: number;
  saldo: number;
  ticketMedio: number;
}

interface InteligenciaFinanceiraProps {
  year: number;
  month: number;
}

export default function InteligenciaFinanceiraDashboard({ year, month }: InteligenciaFinanceiraProps) {
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-inteligencia-financeira?year=${year}&month=${month}`);
        const result = await res.json();
        if (result.success) {
          setChurches(result.churchesData || []);
          setGlobalData(result.globalData || null);
          setHistoryData(result.historyData || []);
        } else {
          console.error(result.error);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, [year, month]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getRankingMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Analisando dados globais...</div>;
  }

  if (!globalData) return null;

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HUD (Head-Up Display) */}
      <h2 style={{ marginBottom: '10px', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Visão Global da Rede</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '10px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Receita Total</h4>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#2ecc71' }}>{formatCurrency(globalData.receita)}</h2>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: globalData.growth >= 0 ? '#2ecc71' : '#e74c3c' }}>
            {globalData.growth >= 0 ? '📈' : '📉'} {Math.abs(globalData.growth).toFixed(1)}% vs Mês Anterior
          </div>
        </div>
        
        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Despesa Total</h4>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#e74c3c' }}>{formatCurrency(globalData.despesa)}</h2>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Saldo Consolidado</h4>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: globalData.saldo >= 0 ? '#3498db' : '#e74c3c' }}>
            {formatCurrency(globalData.saldo)}
          </h2>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>Ticket Médio (Entradas)</h4>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#f1c40f' }}>{formatCurrency(globalData.ticketMedio)}</h2>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Baseado no volume total de doações
          </div>
        </div>
      </div>

      {/* 3 COLUNAS PRINCIPAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '10px' }}>
        
        {/* COLUNA 1: Resumo das Igrejas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>⛪ Igrejas da Rede</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }} className="custom-scrollbar">
            {churches.map(c => (
              <div key={c.id} className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: c.saldoAtual >= 0 ? '4px solid #2ecc71' : '4px solid #e74c3c' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  {c.logo ? (
                    <img src={c.logo} alt={c.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⛪</div>
                  )}
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{c.name}</h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Entradas:</span>
                  <strong style={{ color: '#2ecc71' }}>{formatCurrency(c.receitaAtual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saídas:</span>
                  <strong style={{ color: '#e74c3c' }}>{formatCurrency(c.despesaAtual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                  <span style={{ color: '#fff' }}>Saldo:</span>
                  <strong style={{ color: c.saldoAtual >= 0 ? '#3498db' : '#e74c3c' }}>{formatCurrency(c.saldoAtual)}</strong>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Cultos / Top Entradas:</h4>
                  {c.cultos.slice(0, 2).map((culto, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px' }}>{culto.name}</span>
                      <strong>{formatCurrency(culto.value)}</strong>
                    </div>
                  ))}
                  {c.cultos.length === 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Sem entradas</div>}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vencidas ({c.contasVencidas})</div>
                    <strong style={{ color: c.contasVencidas > 0 ? '#e74c3c' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {formatCurrency(c.contasVencidasValor)}
                    </strong>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>A Pagar ({c.contasAPagar})</div>
                    <strong style={{ color: '#f1c40f', fontSize: '0.9rem' }}>
                      {formatCurrency(c.contasAPagarValor)}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ticket Médio: <strong style={{ color: '#fff' }}>{formatCurrency(c.ticketMedio)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 2: Evolução Mês a Mês */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>📈 Evolução Global (12 Meses)</h3>
          <div className="glass" style={{ padding: '20px', borderRadius: '12px', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historyData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} stroke="var(--text-secondary)" tick={{fontSize: 10}} width={50} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R$${(v/1).toFixed(0)}`} stroke="#f1c40f" tick={{fontSize: 10}} width={50} />
                  
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '5px' }}
                    formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  
                  <Bar yAxisId="left" dataKey="receitas" name="Entradas" fill="#2ecc71" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar yAxisId="left" dataKey="despesas" name="Saídas" fill="#e74c3c" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  
                  <Line yAxisId="left" type="monotone" dataKey="saldo" name="Saldo" stroke="#3498db" strokeWidth={3} dot={{ r: 4, fill: '#3498db', strokeWidth: 2, stroke: '#1a1a2e' }} />
                  <Line yAxisId="right" type="monotone" dataKey="ticketMedio" name="Ticket Médio" stroke="#f1c40f" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#f1c40f', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COLUNA 3: Ranking de Arrecadação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🏆 Ranking de Arrecadação</h3>
          <div className="glass" style={{ padding: '0', borderRadius: '12px', maxHeight: '600px', overflowY: 'auto' }} className="custom-scrollbar">
            {churches.map((c, idx) => (
              <div key={c.id} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '16px 20px', 
                borderBottom: idx < churches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                transition: 'background 0.2s',
              }} className="hover-highlight">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    width: '30px', height: '30px', 
                    borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: idx <= 2 ? '1.2rem' : '0.9rem', 
                    fontWeight: 700, color: 'var(--text-secondary)'
                  }}>
                    {getRankingMedal(idx)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.entradasCount} doações</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2ecc71' }}>{formatCurrency(c.receitaAtual)}</div>
                  {c.receitaAnterior > 0 && (
                    <div style={{ fontSize: '0.7rem', color: c.receitaAtual >= c.receitaAnterior ? '#2ecc71' : '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      {c.receitaAtual >= c.receitaAnterior ? '▲' : '▼'} 
                      {Math.abs(((c.receitaAtual - c.receitaAnterior) / c.receitaAnterior) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }
        .hover-highlight:hover {
          background: rgba(255,255,255,0.05) !important;
        }
      `}} />
    </div>
  );
}
