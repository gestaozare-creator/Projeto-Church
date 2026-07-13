"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './relatorios.css';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

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
  payment_method?: string;
}

type ReportType = 'TODOS' | 'SECRETARIA' | 'FINANCEIRO' | 'RECEITAS' | 'DESPESAS';

export default function RelatoriosPage() {
  const { currentUser, activeChurchId, canSeeAllChurches } = useAuth();
  const router = useRouter();

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [reportType, setReportType] = useState<ReportType>('SECRETARIA');
  
  const [churchName, setChurchName] = useState<string>('');
  const [churchLogo, setChurchLogo] = useState<string>('');
  const [pastorName, setPastorName] = useState<string>('');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [visitors, setVisitors] = useState<MemberData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [churchList, setChurchList] = useState<any[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>('');

  const isAllowed = currentUser && ['superadmin', 'pastor_diretor', 'admin', 'financeiro'].includes(currentUser.role);

  useEffect(() => {
    if (canSeeAllChurches) {
      supabase.from('churches').select('id, name').order('name').then(({ data }) => {
        if (data && data.length > 0) {
          setChurchList(data);
          if (!selectedChurch && !activeChurchId) {
            setSelectedChurch(data[0].id);
          }
        }
      });
    }
  }, [canSeeAllChurches, activeChurchId, selectedChurch]);

  useEffect(() => {
    if (!currentUser || !isAllowed) return;

    const churchToFetch = selectedChurch || activeChurchId || currentUser.churchId;
    if (!churchToFetch) return; // Wait until we have a church to fetch

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-relatorios-data?churchId=${churchToFetch}&year=${year}&month=${month}`);
        const result = await res.json();
        if (result.success) {
          setChurchName(result.churchName || 'Igreja');
          setChurchLogo(result.churchLogo || '');
          setPastorName(result.pastorName || 'Responsável');
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
  }, [year, month, currentUser, activeChurchId, canSeeAllChurches, isAllowed, selectedChurch]);

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

  const formatCultoKey = (culto?: string, horario?: string) => {
    let diaEHora = horario || 'S/ Horário';
    let nomeCulto = culto || 'Geral';
    // Se o horário não tiver "feira" ou "Domingo"/"Sábado", e for apenas uma hora, podemos tentar inferir, 
    // mas geralmente o BD de membros já traz "Quinta-feira às 15:00".
    return `${diaEHora} - ${nomeCulto}`;
  };

  const visitantesPorCulto = visitors.reduce((acc, v) => {
    const chave = formatCultoKey(v.culto, v.horario);
    if(!acc[chave]) acc[chave] = { total: 0, em_conversao: 0 };
    acc[chave].total++;
    if(v.status === 'em_conversao' || v.status === 'Em Consolidação' || v.status === 'Novo' || v.status === 'Ativo') {
      acc[chave].em_conversao++;
    }
    return acc;
  }, {} as Record<string, { total: number, em_conversao: number }>);

  const visitantesList = Object.keys(visitantesPorCulto).sort().map(chave => ({
    culto: chave,
    ...visitantesPorCulto[chave]
  }));

  const membrosPorCulto = members.reduce((acc, m) => {
    const chave = formatCultoKey(m.culto, m.horario);
    if(!acc[chave]) acc[chave] = 0;
    acc[chave]++;
    return acc;
  }, {} as Record<string, number>);

  const membrosList = Object.keys(membrosPorCulto).sort().map(chave => ({
    culto: chave,
    total: membrosPorCulto[chave]
  }));

  // Agrupamento Financeiro por Dia/Horário
  const extractDayTimeFromTransaction = (t: TransactionData): string => {
    let dayOfWeek = '';
    if (t.date) {
      const d = new Date(t.date + 'T12:00:00Z'); // Força o fuso para evitar pular dia
      if (!isNaN(d.getTime())) {
        dayOfWeek = daysOfWeek[d.getUTCDay()];
      }
    }

    const isCulto = t.category?.toLowerCase().includes('culto') || t.description?.toLowerCase().includes('culto');
    if (!isCulto) {
      return 'Outras Entradas';
    }

    if (!dayOfWeek) return 'Cultos Sem Data';
    return dayOfWeek;
  };

  const extractCultoName = (t: TransactionData) => {
    const regexCulto = /Culto de (.*?)(?:\s+às|\s*$)/i;
    const matchCulto = t.description?.match(regexCulto);
    return matchCulto ? matchCulto[1].trim() : 'Geral/Outros';
  };

  const financeiroAgrupado = transactions.reduce((acc, t) => {
    const chave = extractDayTimeFromTransaction(t);
    if (!acc[chave]) acc[chave] = { receitas: 0, despesas: 0 };
    if (t.type === 'INCOME' || t.type === 'receita') {
      acc[chave].receitas += Number(t.amount);
    } else {
      acc[chave].despesas += Number(t.amount);
    }
    return acc;
  }, {} as Record<string, { receitas: number, despesas: number }>);

  const financeiroList = Object.keys(financeiroAgrupado).sort().map(chave => ({
    culto: chave,
    ...financeiroAgrupado[chave]
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

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = async () => {
    const element = document.getElementById('a4-report-page');
    if (!element) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `Relatorio_${churchName}_${monthNames[month]}_${year}.pdf`;
      const opt: any = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      const originalMargin = element.style.margin;
      
      element.style.width = '794px';
      element.style.maxWidth = '794px';
      element.style.margin = '0';
      
      // Generate PDF as blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      // Restaura o tamanho original
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.margin = originalMargin;

      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Relatório',
          text: `Relatório de ${churchName} - ${monthNames[month]} de ${year}`
        });
      } else {
        // Fallback para Desktop: baixa o arquivo e avisa o usuário
        html2pdf().set(opt).from(element).save();
        alert("O seu navegador não suporta compartilhamento direto. O PDF foi baixado automaticamente. Por favor, anexe-o no seu WhatsApp Web.");
      }
    } catch (e) {
      console.error("Erro ao gerar PDF", e);
      alert("Não foi possível gerar o PDF para compartilhar.");
    }
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
          {canSeeAllChurches && churchList.length > 0 && (
            <div className="filter-group">
              <label>Igreja:</label>
              <select 
                value={selectedChurch || activeChurchId || ''} 
                onChange={e => setSelectedChurch(e.target.value)} 
                className="glass-input" 
                style={{ width: '180px' }}
              >
                {churchList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setReportType('SECRETARIA')} 
                className={`tab-btn ${reportType === 'SECRETARIA' ? 'active-sec' : ''}`}
              >
                📁 Secretaria
              </button>
              <button 
                onClick={() => setReportType('FINANCEIRO')} 
                className={`tab-btn ${reportType === 'FINANCEIRO' ? 'active-fin' : ''}`}
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

          <button onClick={handlePrint} className="btn-print" title="Imprimir Relatório">🖨️ Imprimir</button>
          <button onClick={handleWhatsApp} className="btn-whatsapp" title="Enviar PDF no WhatsApp">💬 Enviar para o WhatsApp</button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Carregando dados detalhados...</div>
      ) : (
        <div className="a4-wrapper">
          <div id="a4-report-page" className="a4-page glass">
            
            <div className="a4-header">
              <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                {churchLogo && (
                  <img src={churchLogo} alt="Logo" style={{ height: '55px', objectFit: 'contain' }} />
                )}
                <span>
                  {churchName} - {reportType === 'SECRETARIA' && 'Relatório de Secretaria'}
                  {reportType === 'FINANCEIRO' && 'Relatório Financeiro'}
                  {reportType === 'RECEITAS' && 'Relatório de Entradas'}
                  {reportType === 'DESPESAS' && 'Relatório de Saídas'}
                  {reportType === 'TODOS' && 'Relatório Geral'}
                </span>
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
                  {/* Resumo Agrupado (Novo) */}
                  {reportType === 'FINANCEIRO' && financeiroList.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
                      <h4 style={{ marginBottom: '10px', color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                        📊 Resumo de Entradas por Culto
                      </h4>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
                        {financeiroList.filter(f => f.receitas > 0).map((f, idx) => (
                          <div key={idx} style={{ background: '#f4f4f4', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 6px', flex: '0 1 120px', minWidth: '0', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.culto.toUpperCase()}>{f.culto.toUpperCase()}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#27ae60' }}>{formatCurrency(f.receitas)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ENTRADAS */}
                  {showReceitas && (
                    <div className="table-wrapper">
                      <div className="table-header-flex">
                        <h4 className="table-subtitle text-green">🟢 Entradas Detalhadas</h4>
                        <span className="table-total text-green">{formatCurrency(totalIncome)}</span>
                      </div>
                      <table className="rel-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Categoria / Culto</th>
                            <th>Forma Pag.</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomes.length === 0 ? (
                            <tr><td colSpan={4} className="empty-state">Nenhuma entrada registrada.</td></tr>
                          ) : (
                            incomes.map(t => (
                              <tr key={t.id}>
                                <td>{formatDate(t.date)}</td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{t.category || 'Entrada'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{extractDayTimeFromTransaction(t)}</div>
                                </td>
                                <td>{t.payment_method || '-'}</td>
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
                            <th>Data</th>
                            <th>Despesa / Destino</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.length === 0 ? (
                            <tr><td colSpan={3} className="empty-state">Nenhuma saída registrada.</td></tr>
                          ) : (
                            expenses.map(t => (
                              <tr key={t.id}>
                                <td>{formatDate(t.date)}</td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{t.category || 'Despesa'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{t.description}</div>
                                </td>
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
            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ccc', textAlign: 'center', width: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>{pastorName}</p>
              <p style={{ margin: '0', fontSize: '0.8rem', color: '#666' }}>Pastor Responsável</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
