"use client";

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface HistoryData {
  name: string;
  receitas: number | null;
  despesas: number | null;
  saldo: number | null;
  ticketMedio: number | null;
}

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
  historyData: HistoryData[];
}

interface GlobalData {
  receita: number;
  despesa: number;
  saldo: number;
  receitaPrev: number;
  growth: number;
  ticketMedio: number;
}

interface InteligenciaFinanceiraProps {
  year: number;
  month: number;
}

const formatCurrency = (val: number) => {
  if (val === null || val === undefined) return '';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Componente para a linha individual da igreja
const ChurchRow = ({ c }: { c: ChurchData }) => {
  const [linesVisibility, setLinesVisibility] = useState({
    receitas: true,
    despesas: true,
    saldo: true
  });

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setLinesVisibility(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof linesVisibility]
    }));
  };

  return (
    <div className="glass church-row-card" style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '12px', borderLeft: c.saldoAtual >= 0 ? '4px solid #2ecc71' : '4px solid #e74c3c' }}>
      
      {/* Lado Esquerdo: Card Resumo (Tamanho Fixo ou Responsivo) */}
      <div className="church-row-summary" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
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

      {/* Lado Direito: Gráfico de Linhas (Ocupa o resto do espaço) */}
      <div style={{ flex: 1, minWidth: 0, height: '280px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', textAlign: 'right' }}>
          Evolução (12 Meses) — Clique na legenda para filtrar
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={c.historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
            <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} stroke="var(--text-secondary)" tick={{fontSize: 10}} />
            
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}} 
              contentStyle={{backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '5px' }}
              formatter={(value: any, name: any) => value !== null ? [formatCurrency(Number(value)), name] : ['Sem dados', name]}
              itemSorter={(item: any) => {
                if (item.dataKey === 'receitas') return 1;
                if (item.dataKey === 'despesas') return 2;
                if (item.dataKey === 'saldo') return 3;
                return 4;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', cursor: 'pointer' }} 
              onClick={handleLegendClick}
            />
            
            <Line yAxisId="left" type="monotone" dataKey="receitas" name="Entradas" hide={!linesVisibility.receitas} stroke="#2ecc71" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
            <Line yAxisId="left" type="monotone" dataKey="despesas" name="Saídas" hide={!linesVisibility.despesas} stroke="#e74c3c" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
            <Line yAxisId="left" type="monotone" dataKey="saldo" name="Saldo" hide={!linesVisibility.saldo} stroke="#3498db" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default function InteligenciaFinanceiraDashboard({ year, month }: InteligenciaFinanceiraProps) {
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
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
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HUD (Head-Up Display) - STICKY TOP */}
      <div style={{ position: 'sticky', top: '65px', zIndex: 10, background: 'var(--bg-base)', paddingTop: '10px', paddingBottom: '10px', margin: '-10px -10px 0 -10px', paddingLeft: '10px', paddingRight: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="glass" style={{ padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Receita Total</h4>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#2ecc71' }}>{formatCurrency(globalData.receita)}</h2>
            <div style={{ marginTop: '5px', fontSize: '0.75rem', color: globalData.growth >= 0 ? '#2ecc71' : '#e74c3c' }}>
              {globalData.growth >= 0 ? '📈' : '📉'} {Math.abs(globalData.growth).toFixed(1)}% vs Mês Anterior
            </div>
          </div>
          
          <div className="glass" style={{ padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Despesa Total</h4>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#e74c3c' }}>{formatCurrency(globalData.despesa)}</h2>
          </div>

          <div className="glass" style={{ padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Saldo Consolidado</h4>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: globalData.saldo >= 0 ? '#3498db' : '#e74c3c' }}>
              {formatCurrency(globalData.saldo)}
            </h2>
          </div>

          <div className="glass" style={{ padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>Ticket Médio</h4>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f1c40f' }}>{formatCurrency(globalData.ticketMedio)}</h2>
            <div style={{ marginTop: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Por doação
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA MISTA: RAIO-X DAS IGREJAS (ESQUERDA) + RANKING (DIREITA) */}
      <div className="raio-x-container" style={{ marginTop: '10px' }}>
        
        {/* LADO ESQUERDO: Lista de Igrejas com Gráficos Individuais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            🔍 Raio-X por Igreja
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '10px' }} className="custom-scrollbar">
            {churches.map(c => (
              <ChurchRow key={c.id} c={c} />
            ))}
          </div>
        </div>

        {/* LADO DIREITO: Ranking de Arrecadação (STICKY) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'sticky', top: '175px', height: 'calc(100vh - 195px)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            🏆 Ranking de Arrecadação
          </h3>
          <div className="glass custom-scrollbar" style={{ padding: '0', borderRadius: '12px', flex: 1, overflowY: 'auto' }}>
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

        /* Responsividade para o Dashboard de Raio-X */
        .raio-x-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        .church-row-summary {
          width: 320px;
        }
        .church-row-card {
          flex-direction: row;
        }

        @media (max-width: 1024px) {
          .raio-x-container {
            grid-template-columns: 1fr;
          }
          .church-row-card {
            flex-direction: column;
          }
          .church-row-summary {
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
