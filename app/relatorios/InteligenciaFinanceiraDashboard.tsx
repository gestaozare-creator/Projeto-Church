"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
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

interface InteligenciaFinanceiraProps {
  year: number;
  month: number;
}

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

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Analisando dados globais...</div>;
  }

  if (!globalData) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. HUD (Head-Up Display) */}
      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Visão Global da Rede</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
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

      {/* 2. Área de Analytics (Gráficos e Rankings) */}
      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Performance e Ranking</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>🏆 Top 5 Igrejas (Arrecadação)</h4>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={churches.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} stroke="var(--text-secondary)" />
                <YAxis dataKey="name" type="category" width={120} stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="receitaAtual" radius={[0, 4, 4, 0]}>
                  {churches.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f1c40f', '#e67e22', '#3498db', '#9b59b6', '#2ecc71'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Painel de Filiais (Cards Individuais) */}
      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Resumo por Igreja</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {churches.map(c => {
          const efficiency = c.receitaAtual > 0 ? (c.saldoAtual / c.receitaAtual) * 100 : 0;
          return (
            <div key={c.id} className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: c.saldoAtual >= 0 ? '4px solid #2ecc71' : '4px solid #e74c3c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                {c.logo ? (
                  <img src={c.logo} alt={c.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    ⛪
                  </div>
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
                  <strong style={{ color: c.contasVencidas > 0 ? '#e74c3c' : '#2ecc71', fontSize: '0.9rem' }}>
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
          )
        })}
      </div>

    </div>
  );
}
