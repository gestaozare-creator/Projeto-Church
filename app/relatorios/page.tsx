"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import './relatorios.css';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MemberData {
  id: string;
  name: string;
  status: string;
  culto: string;
  horario: string;
}

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'receita' | 'despesa';
  date: string;
  category: string;
}

type ReportType = 'TODOS' | 'SECRETARIA' | 'FINANCEIRO' | 'RECEITAS' | 'DESPESAS';

export default function RelatoriosPage() {
  const { currentUser, activeChurchId, canSeeAllChurches } = useAuth();
  const router = useRouter();

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [reportType, setReportType] = useState<ReportType>('SECRETARIA');
  
  const [churchName, setChurchName] = useState<string>('');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [visitors, setVisitors] = useState<MemberData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  const isAllowed = currentUser && ['superadmin', 'pastor_diretor', 'admin', 'financeiro'].includes(currentUser.role);

  useEffect(() => {
    if (!currentUser || !isAllowed) return;

    const churchToFetch = activeChurchId || (canSeeAllChurches ? '1' : currentUser.churchId);

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-relatorios-data?churchId=${churchToFetch}&year=${year}&month=${month}`);
        const result = await res.json();
        if (result.success) {
          setChurchName(result.churchName || 'Igreja');
          setMembers(result.members || []);
          setVisitors(result.visitors || []);
          setTransactions(result.transactions || []);
        } else {
          console.error(result.error);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, [year, month, currentUser, activeChurchId, canSeeAllChurches, isAllowed]);

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

  const visitantesPorCulto = visitors.reduce((acc, v) => {
    const chave = `${v.culto || 'Geral'} - ${v.horario || 'S/ Horário'}`;
    if(!acc[chave]) acc[chave] = { total: 0, em_conversao: 0 };
    acc[chave].total++;
    if(v.status === 'em_conversao' || v.status === 'Em Consolidação' || v.status === 'Novo' || v.status === 'Ativo') {
      acc[chave].em_conversao++;
    }
    return acc;
  }, {} as Record<string, { total: number, em_conversao: number }>);

  const visitantesList = Object.keys(visitantesPorCulto).map(chave => ({
    culto: chave,
    ...visitantesPorCulto[chave]
  }));

  const membrosPorCulto = members.reduce((acc, m) => {
    const chave = `${m.culto || 'Geral'} - ${m.horario || 'S/ Horário'}`;
    if(!acc[chave]) acc[chave] = 0;
    acc[chave]++;
    return acc;
  }, {} as Record<string, number>);

  const membrosList = Object.keys(membrosPorCulto).map(chave => ({
    culto: chave,
    total: membrosPorCulto[chave]
  }));

  const incomes = transactions.filter(t => t.type === 'INCOME' || t.type === 'receita');
  const expenses = transactions.filter(t => t.type === 'EXPENSE' || t.type === 'despesa');
  
  const totalIncome = incomes.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // using UTC to avoid off-by-one day issues
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handlePdfGeneration = async () => {
    const element = document.getElementById('a4-report-page');
    if (!element) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       10, // Menos margem
        filename:     `Relatorio_${churchName}_${monthNames[month]}_${year}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("Erro ao gerar PDF", e);
      alert("Não foi possível gerar o PDF. A biblioteca html2pdf.js pode não ter sido carregada corretamente.");
    }
  };

  const handleWhatsApp = () => {
    const isPositive = balance >= 0;
    const text = `*RELATÓRIO ${churchName.toUpperCase()} - ${monthNames[month].toUpperCase()} ${year}* 📊

*Almas* 🔥
👥 Novos Membros: ${members.length}
👋 Visitantes: ${visitors.length}

*Financeiro* 💰
🟢 Entradas: ${formatCurrency(totalIncome)}
🔴 Saídas: ${formatCurrency(totalExpense)}
${isPositive ? '🔵 Saldo:' : '🔴 Saldo:'} ${formatCurrency(balance)}`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  // Renderização condicional das sessões
  const showSecretaria = ['TODOS', 'SECRETARIA'].includes(reportType);
  const showFinanceiroGeral = ['TODOS', 'FINANCEIRO'].includes(reportType);
  const showReceitas = ['TODOS', 'FINANCEIRO', 'RECEITAS'].includes(reportType);
  const showDespesas = ['TODOS', 'FINANCEIRO', 'DESPESAS'].includes(reportType);

  return (
    <div className="fade-in relatorios-container">
      <div className="relatorios-header no-print">
        <div>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>📄 Relatórios (PDF)</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Selecione o tipo de relatório que deseja gerar.
          </p>
        </div>
        
        <div className="relatorios-filters">
          <div className="filter-group">
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setReportType('SECRETARIA')} 
                className={`glass-button ${reportType === 'SECRETARIA' ? 'active-filter' : ''}`}
                style={{ padding: '10px 15px', borderRadius: '8px', border: reportType === 'SECRETARIA' ? '1px solid #3498db' : '1px solid rgba(255,255,255,0.2)', background: reportType === 'SECRETARIA' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.1)' }}
              >
                📁 Secretaria
              </button>
              <button 
                onClick={() => setReportType('FINANCEIRO')} 
                className={`glass-button ${reportType === 'FINANCEIRO' ? 'active-filter' : ''}`}
                style={{ padding: '10px 15px', borderRadius: '8px', border: reportType === 'FINANCEIRO' ? '1px solid #2ecc71' : '1px solid rgba(255,255,255,0.2)', background: reportType === 'FINANCEIRO' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)' }}
              >
                💰 Financeiro
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Mês:</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="glass-input">
              {monthNames.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Ano:</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-input">
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>

          <button onClick={handlePdfGeneration} className="btn-print" title="Baixar PDF">🖨️ Gerar PDF</button>
          <button onClick={handleWhatsApp} className="btn-whatsapp" title="Enviar Resumo">💬 WhatsApp</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Carregando dados detalhados...</div>
      ) : (
        <div className="a4-wrapper">
          <div id="a4-report-page" className="a4-page glass">
            
            <div className="a4-header">
              <h2 className="church-name">{churchName}</h2>
              <h1>
                {reportType === 'SECRETARIA' && 'Relatório de Secretaria'}
                {reportType === 'FINANCEIRO' && 'Relatório Financeiro'}
                {reportType === 'RECEITAS' && 'Relatório de Entradas'}
                {reportType === 'DESPESAS' && 'Relatório de Saídas'}
                {reportType === 'TODOS' && 'Relatório Geral (Desempenho e Financeiro)'}
              </h1>
              <h3>{monthNames[month]} de {year}</h3>
            </div>

            {/* SESSÃO ALMAS */}
            {showSecretaria && (
              <div className="relatorio-section">
                <h3 className="section-title">🔥 Crescimento de Almas (Por Cultos)</h3>
                
                <div className="tables-row">
                  {/* VISITANTES */}
                  <div className="table-wrapper">
                    <h4 className="table-subtitle highlight-orange">👋 Visitantes ({visitors.length})</h4>
                    <table className="rel-table">
                      <thead>
                        <tr>
                          <th>Culto / Horário</th>
                          <th style={{ textAlign: 'center' }}>Total Visitantes</th>
                          <th style={{ textAlign: 'center' }}>Em Conversão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitantesList.length === 0 ? (
                          <tr><td colSpan={3} className="empty-state">Nenhum visitante registrado.</td></tr>
                        ) : (
                          visitantesList.map((v, idx) => (
                            <tr key={idx}>
                              <td><strong>{v.culto}</strong></td>
                              <td style={{ textAlign: 'center' }}>{v.total}</td>
                              <td style={{ textAlign: 'center' }} className="highlight-orange">{v.em_conversao}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                      * Visitantes são a ponta de partida para novos membros.
                    </div>
                  </div>

                  {/* MEMBROS */}
                  <div className="table-wrapper">
                    <h4 className="table-subtitle highlight-blue">👥 Novos Membros ({members.length})</h4>
                    <table className="rel-table">
                      <thead>
                        <tr>
                          <th>Culto / Horário</th>
                          <th style={{ textAlign: 'center' }}>Total Adicionados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membrosList.length === 0 ? (
                          <tr><td colSpan={2} className="empty-state">Nenhum membro integrado.</td></tr>
                        ) : (
                          membrosList.map((m, idx) => (
                            <tr key={idx}>
                              <td><strong>{m.culto}</strong></td>
                              <td style={{ textAlign: 'center' }} className="highlight-blue">{m.total}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SESSÃO FINANCEIRA */}
            {(showFinanceiroGeral || showReceitas || showDespesas) && (
              <div className="relatorio-section">
                {(showFinanceiroGeral || reportType === 'TODOS') && (
                  <div className="finance-header">
                    <h3 className="section-title">💰 Livro Caixa Detalhado</h3>
                    <div className={`finance-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                      <span>Saldo Mensal</span>
                      <strong>{formatCurrency(balance)}</strong>
                    </div>
                  </div>
                )}
                
                <div className={`tables-row finance-tables ${(showReceitas && !showDespesas) || (!showReceitas && showDespesas) ? 'one-col-print' : ''}`}>
                  {/* ENTRADAS */}
                  {showReceitas && (
                    <div className="table-wrapper">
                      <div className="table-header-flex">
                        <h4 className="table-subtitle text-green">🟢 Entradas</h4>
                        <span className="table-total text-green">{formatCurrency(totalIncome)}</span>
                      </div>
                      <table className="rel-table">
                        <thead>
                          <tr>
                            <th>Tipo / Culto / Horário</th>
                            <th>Data</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomes.length === 0 ? (
                            <tr><td colSpan={3} className="empty-state">Nenhuma entrada registrada.</td></tr>
                          ) : (
                            incomes.map(t => (
                              <tr key={t.id}>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{t.category || 'Entrada'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{t.description}</div>
                                </td>
                                <td>{formatDate(t.date)}</td>
                                <td style={{ textAlign: 'right' }} className="text-green">{formatCurrency(t.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SAIDAS */}
                  {showDespesas && (
                    <div className="table-wrapper">
                      <div className="table-header-flex">
                        <h4 className="table-subtitle text-red">🔴 Saídas</h4>
                        <span className="table-total text-red">{formatCurrency(totalExpense)}</span>
                      </div>
                      <table className="rel-table">
                        <thead>
                          <tr>
                            <th>Despesa / Destino</th>
                            <th>Data</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.length === 0 ? (
                            <tr><td colSpan={3} className="empty-state">Nenhuma saída registrada.</td></tr>
                          ) : (
                            expenses.map(t => (
                              <tr key={t.id}>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{t.category || 'Saída'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{t.description}</div>
                                </td>
                                <td>{formatDate(t.date)}</td>
                                <td style={{ textAlign: 'right' }} className="text-red">{formatCurrency(t.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* ASSINATURA */}
            <div className="signature-block">
              <div className="signature-line"></div>
              <p>Assinatura do Responsável</p>
              <span>{churchName}</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
