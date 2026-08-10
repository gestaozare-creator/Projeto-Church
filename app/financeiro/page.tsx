"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobalData } from '@/hooks/useGlobalData';
import { supabase } from '@/lib/supabaseClient';

// Tipo local de transação (view model — camelCase)
interface FinancialTransaction {
  id: string;
  churchId: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  memberId?: string;
  supplierId?: string;
  status: string;
  date: string;
  dueDate?: string;
  paidDate?: string;
  attachment_url?: string;
}

// Componente Reutilizável de Gráfico de Rosca (Donut)
function DonutChart({ 
  title, 
  data, 
  total, 
  formatValue = (v: number) => v.toString(),
  formatCenterTotal = (v: number) => v.toString(),
  onClickSlice,
  activeSlice
}: { 
  title: string; 
  data: { key: string; label: string; value: number; color: string }[];
  total: number;
  formatValue?: (v: number) => string;
  formatCenterTotal?: (v: number) => string;
  onClickSlice?: (key: string) => void;
  activeSlice?: string | null;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const slices = useMemo(() => {
    const safeTotal = total || 1;
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };
    
    const result = [];
    for (const item of data) {
      if (item.value === 0) continue;
      
      const startPercent = cumulativePercent;
      const slicePercent = item.value / safeTotal;
      cumulativePercent += slicePercent;
      const endPercent = cumulativePercent;

      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(endPercent);
      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
      
      let pathData = '';
      if (slicePercent === 1) {
        pathData = `M 1 0 A 1 1 0 1 1 1 -0.0001`;
      } else {
        pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
        ].join(' ');
      }
      
      result.push({ ...item, percent: slicePercent, pathData });
    }
    return result;
  }, [data, total]);

  const hoveredData = slices.find(s => s.key === hoveredSlice);

  return (
    <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ fontSize: '0.9rem', margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '20px' }}>
        {slices.length > 0 ? (
          <>
            <div style={{ position: 'relative', height: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ height: '100%', width: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <defs>
                  <mask id={`donutMask-${title.replace(/[^a-z0-9]/gi, '')}`}>
                    <rect x="-1.5" y="-1.5" width="3" height="3" fill="white" />
                    <circle cx="0" cy="0" r="0.65" fill="black" />
                  </mask>
                </defs>
                <g mask={`url(#donutMask-${title.replace(/[^a-z0-9]/gi, '')})`}>
                  {slices.map((slice, i) => {
                    const isHovered = hoveredSlice === slice.key;
                    const isActive = activeSlice === slice.key;
                    const scale = isHovered ? 'scale(1.08)' : isActive ? 'scale(1.05)' : 'scale(1)';
                    const opacity = (activeSlice && !isActive) ? 0.3 : 1;
                    return (
                      <path 
                        key={i} 
                        d={slice.pathData} 
                        fill={slice.color} 
                        style={{ cursor: onClickSlice ? 'pointer' : 'default', transform: scale, transformOrigin: 'center', transition: 'transform 0.2s, opacity 0.2s', opacity }}
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => onClickSlice && onClickSlice(slice.key)}
                      />
                    );
                  })}
                </g>
              </svg>
              {/* Texto Central */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center', width: '60%' }}>
                {hoveredData ? (
                  <>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: '1.2' }}>{hoveredData.label}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: hoveredData.color, lineHeight: '1.2' }}>{(hoveredData.percent * 100).toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: '1.2' }}>Total</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>{formatCenterTotal(total)}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Legenda Lateral com efeito Hover */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '140px' }}>
              {data.map((item, i) => {
                if (item.value === 0) return null;
                const isHovered = hoveredSlice === item.key;
                const isActive = activeSlice === item.key;
                const opacity = (hoveredSlice && !isHovered) ? 0.3 : (activeSlice && !isActive && !hoveredSlice) ? 0.3 : 1;
                return (
                  <div 
                    key={i} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: onClickSlice ? 'pointer' : 'default', opacity, transition: 'opacity 0.2s' }}
                    onMouseEnter={() => setHoveredSlice(item.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => onClickSlice && onClickSlice(item.key)}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{formatValue(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Sem dados</div>
        )}
      </div>
    </div>
  );
}

const getMonthBounds = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
  const firstDayStr = `${yyyy}-${mm}-01`;
  const lastDayStr = `${yyyy}-${mm}-${lastDay}`;
  return { firstDayStr, lastDayStr };
};
const { firstDayStr, lastDayStr } = getMonthBounds();

export default function FinanceiroDashboardPage() {
  const { currentUser, canSeeAllChurches, isPastorRegional, regionalChurchIds, activeChurchId, activeMinistryId } = useAuth();
  const { churches, churchServices, members } = useGlobalData();
  const [dbTransactions, setDbTransactions] = useState<FinancialTransaction[]>([]);

  useEffect(() => {
    async function loadAllTransactions(validChurchIds: string[]) {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;

      // PAGINAÇÃO OBRIGATÓRIA: Supabase limita 1000 registros por query.
      // Sem paginação, transações são silenciosamente perdidas, causando totais errados no dashboard.
      while (true) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .in('church_id', validChurchIds)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        page++;
      }

      if (allData.length > 0) {
        setDbTransactions(allData.map((t: any) => ({
          id: t.id,
          churchId: t.church_id || '1',
          type: t.type,
          category: t.category,
          description: t.description || '',
          amount: Number(t.amount),
          paymentMethod: t.payment_method || '',
          memberId: t.member_id || undefined,
          supplierId: t.supplier_id || undefined,
          status: t.status,
          date: t.date,
          dueDate: t.due_date || undefined,
          paidDate: t.paid_date || undefined
        })));
      }
    }

    if (churches && churches.length > 0) {
      loadAllTransactions(churches.map((c: any) => c.id));
    }
  }, [churches]);

  const [church, setChurch] = useState(activeChurchId ? activeChurchId : (canSeeAllChurches || isPastorRegional ? 'ALL' : (currentUser?.churchId || 'ALL')));
  const [startDate, setStartDate] = useState(firstDayStr);
  const [endDate, setEndDate] = useState(lastDayStr);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  
  const [cultoFilter, setCultoFilter] = useState('ALL');
  const [horarioFilter, setHorarioFilter] = useState('ALL');
  
  const [chartYear, setChartYear] = useState(new Date().getFullYear().toString());
  const [showCompareCultos, setShowCompareCultos] = useState(false);
  const [showCompareEntradas, setShowCompareEntradas] = useState(false);
  const [showCompareSaldo, setShowCompareSaldo] = useState(false);

  const [hiddenEvolucaoLines, setHiddenEvolucaoLines] = useState<string[]>([]);
  const toggleEvolucaoLine = (key: string) => setHiddenEvolucaoLines(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const [hiddenHistoricoLines, setHiddenHistoricoLines] = useState<string[]>([]);
  const toggleHistoricoLine = (key: string) => setHiddenHistoricoLines(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);


  const [evolucaoChartType, setEvolucaoChartType] = useState<'barra' | 'linha'>('linha');
  const [evolucaoHoveredMonthIdx, setEvolucaoHoveredMonthIdx] = useState<number | null>(null);

  const [showAllEntradas, setShowAllEntradas] = useState(false);
  const [showAllSaidas, setShowAllSaidas] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);

  useEffect(() => {
    if (activeChurchId) {
      setChurch(activeChurchId);
    } else if (!canSeeAllChurches && !isPastorRegional) {
      setChurch(currentUser?.churchId || 'ALL');
    }
  }, [activeChurchId, currentUser, canSeeAllChurches, isPastorRegional]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  const formatShortCurrency = (value: number) => {
    return formatCurrency(value).replace(',00', '');
  };

  const availableCultos = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    const names = new Set(svcs.map(s => s.name).filter(Boolean));
    return Array.from(names).sort();
  }, [church, churchServices]);

  const cultosDaysMap = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    const map = new Map<string, string>();
    svcs.forEach(s => {
      const day = s.dayOfWeek || s.day_of_week;
      if (s.name && day) {
        map.set(s.name.toLowerCase(), day);
      }
    });
    return map;
  }, [church, churchServices]);

  const cultosTimeMap = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    const map = new Map<string, string>();
    svcs.forEach(s => {
      if (s.name && s.time) {
        map.set(s.name.toLowerCase(), s.time);
      }
    });
    return map;
  }, [church, churchServices]);

  const availableDiasCulto = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    const dias = new Set(svcs.map(s => s.dayOfWeek || s.day_of_week).filter(Boolean));
    return Array.from(dias).sort();
  }, [church, churchServices]);

  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    if (cultoFilter === 'ALL') {
      const times = new Set(svcs.map(s => s.time));
      return Array.from(times).sort();
    } else {
      const times = new Set(svcs.filter(s => s.name === cultoFilter).map(s => s.time));
      return Array.from(times).sort();
    }
  }, [church, cultoFilter, churchServices]);

  // Remove dangling code

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);

  // 1. Filtrar Transações Ativas
  const filteredTransactions = useMemo(() => {
    return dbTransactions.filter(t => {
      if (church !== 'ALL' && t.churchId !== church) return false;
      if (t.status === 'cancelado') return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      
      if (cultoFilter !== 'ALL') {
        const desc = t.description.toLowerCase();
        if (!desc.includes(cultoFilter.toLowerCase())) return false;
      }
      
      if (horarioFilter !== 'ALL') {
        if (!t.description.includes(horarioFilter)) return false;
      }

      return true;
    });
  }, [church, startDate, endDate, cultoFilter, horarioFilter, dbTransactions]);

  // KPIs
  const receitas = filteredTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado').reduce((a, b) => a + b.amount, 0);
  const despesas = filteredTransactions.filter(t => t.type === 'despesa' && t.status === 'confirmado').reduce((a, b) => a + b.amount, 0);
  const kpiSaldo = receitas - despesas;
  
  const dizimos = filteredTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado' && t.category === 'Dízimo').reduce((a, b) => a + b.amount, 0);
  const dizimosPercent = receitas > 0 ? (dizimos / receitas) * 100 : 0;

  // 2. Lógica para Entradas por Culto
  const receitasCultoData = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    
    filteredTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado').forEach(t => {
      const desc = t.description.toLowerCase();
      let matchedDia = 'Outros';
      
      const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      for (const dia of DIAS_SEMANA) {
        const normalizedDia = dia.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        const normalizedDesc = desc.replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        if (normalizedDesc.includes(normalizedDia)) {
          matchedDia = dia;
          break;
        }
      }
      
      if (matchedDia === 'Outros') {
        for (const culto of availableCultos) {
          if (desc.includes(culto.toLowerCase())) {
            matchedDia = cultosDaysMap.get(culto.toLowerCase()) || culto;
            break;
          }
        }
      }
      
      const current = map.get(matchedDia) || 0;
      map.set(matchedDia, current + t.amount);
      total += t.amount;
    });

    const colors = ['#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#e74c3c'];
    let colorIdx = 0;
    const slices = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => {
        const color = key === 'Outros' ? '#888888' : colors[colorIdx++ % colors.length];
        return { key, color, label: key, value: val };
      });

    return { total, slices };
  }, [filteredTransactions, availableCultos, cultosDaysMap]);

  const selectedDiaTransactions = useMemo(() => {
    if (!selectedDia) return filteredTransactions;
    return filteredTransactions.filter(t => {
      const desc = t.description.toLowerCase();
      let matchedDia = 'Outros';
      const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      for (const dia of DIAS_SEMANA) {
        const normalizedDia = dia.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        const normalizedDesc = desc.replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        if (normalizedDesc.includes(normalizedDia)) {
          matchedDia = dia;
          break;
        }
      }
      
      if (matchedDia === 'Outros') {
        for (const culto of availableCultos) {
          if (desc.includes(culto.toLowerCase())) {
            matchedDia = cultosDaysMap.get(culto.toLowerCase()) || culto;
            break;
          }
        }
      }
      return matchedDia === selectedDia;
    });
  }, [filteredTransactions, selectedDia, availableCultos, cultosDaysMap]);

  // Detalhamento por Horário de Culto
  const receitasHorarioData = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    
    selectedDiaTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado').forEach(t => {
      const desc = t.description.toLowerCase();
      let matchedTime = 'Outros';
      
      for (const culto of availableCultos) {
        if (desc.includes(culto.toLowerCase())) {
          matchedTime = cultosTimeMap.get(culto.toLowerCase()) || culto;
          break;
        }
      }
      
      if (matchedTime === 'Outros') {
        const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        for (const dia of DIAS_SEMANA) {
          const normalizedDia = dia.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
          const normalizedDesc = desc.replace('-', ' ').replace('á', 'a').replace('ç', 'c');
          if (normalizedDesc.includes(normalizedDia)) {
             let svcs = church === 'ALL' ? churchServices : churchServices?.filter(s => s.church_id === church);
             const svc = (svcs || []).find(s => ((s as any).dayOfWeek || s.day_of_week) === dia);
             if (svc && svc.time) {
                matchedTime = svc.time;
             }
             break;
          }
        }
      }
      
      const current = map.get(matchedTime) || 0;
      map.set(matchedTime, current + t.amount);
      total += t.amount;
    });

    const colors = ['#e67e22', '#1abc9c', '#9b59b6', '#3498db', '#f1c40f', '#e74c3c'];
    let colorIdx = 0;
    const slices = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => {
        const color = key === 'Outros' ? '#888888' : colors[colorIdx++ % colors.length];
        return { key, color, label: key, value: val };
      });

    return { total, slices };
  }, [selectedDiaTransactions, availableCultos, cultosTimeMap]);

  // 3. Lógica para Formas de Pagamento (Entradas)
  const pagamentosReceitaData = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    selectedDiaTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado').forEach(t => {
      const current = map.get(t.paymentMethod) || 0;
      map.set(t.paymentMethod, current + t.amount);
      total += t.amount;
    });
    const colors = ['#2ecc71', '#27ae60', '#1abc9c', '#16a085', '#f39c12'];
    const slices = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).map(([key, val], i) => ({
      key, label: key, value: val, color: colors[i % colors.length]
    }));
    return { total, slices };
  }, [selectedDiaTransactions]);

  // 4. Lógica para Formas de Pagamento (Saídas)
  const pagamentosSaidaData = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    filteredTransactions.filter(t => t.type === 'despesa' && t.status === 'confirmado').forEach(t => {
      const current = map.get(t.paymentMethod) || 0;
      map.set(t.paymentMethod, current + t.amount);
      total += t.amount;
    });
    const colors = ['#e74c3c', '#c0392b', '#d35400', '#e67e22', '#8e44ad'];
    const slices = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).map(([key, val], i) => ({
      key, label: key, value: val, color: colors[i % colors.length]
    }));
    return { total, slices };
  }, [filteredTransactions]);

  // 5. Gráfico Detalhamento: Receitas por Categoria
  const receitasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    let max = 0;
    selectedDiaTransactions.filter(t => t.type === 'receita').forEach(t => {
      const current = map.get(t.category) || 0;
      const newVal = current + t.amount;
      map.set(t.category, newVal);
      if (newVal > max) max = newVal;
    });
    return { data: Array.from(map.entries()).sort((a,b) => b[1] - a[1]), max };
  }, [selectedDiaTransactions]);

  const chartTransactions = useMemo(() => {
    return dbTransactions.filter(t => {
      if (church !== 'ALL' && t.churchId !== church) return false;
      if (t.status === 'cancelado') return false;
      return true;
    });
  }, [church, dbTransactions]);

  // 7. Gráfico Evolutivo: Entradas por Culto Mês a Mês
  const evolucaoCultos = useMemo(() => {
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      monthStr: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i],
      curr: {} as Record<string, number | null>,
      prev: {} as Record<string, number | null>
    }));
    
    const prevYear = (parseInt(chartYear) - 1).toString();
    let maxValue = 0;

    chartTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado').forEach(t => {
      const [y, mStr] = t.date.split('-');
      if (y !== chartYear && y !== prevYear) return;
      const m = parseInt(mStr, 10) - 1;
      const desc = t.description.toLowerCase();
      const amount = t.amount;
      const target = y === chartYear ? monthsData[m].curr : monthsData[m].prev;
      
      let matchedDia = 'Outros';
      const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      for (const dia of DIAS_SEMANA) {
        const normalizedDia = dia.toLowerCase().replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        const normalizedDesc = desc.replace('-', ' ').replace('á', 'a').replace('ç', 'c');
        if (normalizedDesc.includes(normalizedDia)) {
          matchedDia = dia;
          break;
        }
      }
      
      if (matchedDia === 'Outros') {
        for (const culto of availableCultos) {
          if (desc.includes(culto.toLowerCase())) {
            matchedDia = cultosDaysMap.get(culto.toLowerCase()) || culto;
            break;
          }
        }
      }
      
      if (target[matchedDia] == null) target[matchedDia] = 0;
      target[matchedDia]! += amount;
      if (target[matchedDia]! > maxValue) maxValue = target[matchedDia]!;
    });
        const currentYearStr = new Date().getFullYear().toString();
      const currentMonthIdx = new Date().getMonth();

      const getLimit = (yStr: string) => {
        if (yStr === currentYearStr) return currentMonthIdx;
        if (parseInt(yStr) < parseInt(currentYearStr)) return 11;
        return -1;
      };

      const currLimit = getLimit(chartYear);
      const prevLimit = getLimit(prevYear);

      const allFoundDias = new Set<string>();
      monthsData.forEach(m => {
        Object.keys(m.curr).forEach(k => { if (k !== 'Outros') allFoundDias.add(k); });
        Object.keys(m.prev).forEach(k => { if (k !== 'Outros') allFoundDias.add(k); });
      });
      const cultosList = Array.from(allFoundDias).sort();

      monthsData.forEach((m, idx) => {
        if (idx <= currLimit) {
          cultosList.forEach(culto => {
            if (m.curr[culto] == null) m.curr[culto] = 0;
          });
          if (m.curr['Outros'] == null) m.curr['Outros'] = 0;
        }
        if (idx <= prevLimit) {
          cultosList.forEach(culto => {
            if (m.prev[culto] == null) m.prev[culto] = 0;
          });
          if (m.prev['Outros'] == null) m.prev['Outros'] = 0;
        }
      });
      
      return { data: monthsData, max: maxValue || 1, cultos: cultosList };
    }, [chartTransactions, chartYear, availableCultos, cultosDaysMap, availableDiasCulto]);

  const CULTOS_COLORS = ['#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#e74c3c'];
  const getCultoColor = (idx: number, isOutros = false) => isOutros ? '#888888' : CULTOS_COLORS[idx % CULTOS_COLORS.length];

  const buildEvolucaoLinePath = (key: string, isPrev: boolean = false) => {
    if (evolucaoCultos.data.length === 0) return '';
    if (hiddenEvolucaoLines.includes(key)) return '';
    const points = evolucaoCultos.data.map((d: any, i) => {
      const target = isPrev ? d.prev : d.curr;
      const val = target[key];
      if (val == null) return null;
      const x = (i / 11) * 100;
      const y = 90 - (val / evolucaoCultos.max) * 80;
      return { x, y };
    });

    const segments: {x:number, y:number}[][] = [];
    let currentSegment: {x:number, y:number}[] = [];
    for (const pt of points) {
      if (pt) {
        currentSegment.push(pt);
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    let path = '';
    for (const segment of segments) {
      if (segment.length === 0) continue;
      if (segment.length === 1) {
        path += `M ${segment[0].x},${segment[0].y} `;
        continue;
      }
      path += `M ${segment[0].x},${segment[0].y} `;
      for (let i = 0; i < segment.length - 1; i++) {
        const p0 = segment[i === 0 ? 0 : i - 1];
        const p1 = segment[i];
        const p2 = segment[i + 1];
        const p3 = segment[i + 2 < segment.length ? i + 2 : i + 1];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
      }
    }
    return path;
  };

  // NOVO: Histórico Mensal de Entradas e Saídas e Saldo
  const historicoMensal = useMemo(() => {
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      monthStr: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i],
      curr: { entradas: null as number | null, saidas: null as number | null, saldo: null as number | null },
      prev: { entradas: null as number | null, saidas: null as number | null, saldo: null as number | null }
    }));

    const prevYear = (parseInt(chartYear) - 1).toString();
    let maxVal = 0;

    chartTransactions.filter(t => t.status === 'confirmado').forEach(t => {
      const [y, mStr] = t.date.split('-');
      if (y !== chartYear && y !== prevYear) return;
      const m = parseInt(mStr, 10) - 1;
      const amount = t.amount;
      const target = y === chartYear ? monthsData[m].curr : monthsData[m].prev;

      if (t.type === 'receita') {
        if (target.entradas === null) target.entradas = 0;
        target.entradas += amount;
      } else if (t.type === 'despesa') {
        if (target.saidas === null) target.saidas = 0;
        target.saidas += amount;
      }
    });

      const currentYearStr = new Date().getFullYear().toString();
      const currentMonthIdx = new Date().getMonth();

      const getLimit = (yStr: string) => {
        if (yStr === currentYearStr) return currentMonthIdx;
        if (parseInt(yStr) < parseInt(currentYearStr)) return 11;
        return -1;
      };

      const currLimit = getLimit(chartYear);
      const prevLimit = getLimit(prevYear);

      monthsData.forEach((d, idx) => {
        if (idx <= currLimit) {
          if (d.curr.entradas === null) d.curr.entradas = 0;
          if (d.curr.saidas === null) d.curr.saidas = 0;
          if (d.curr.saldo === null) d.curr.saldo = 0;
        }
        if (idx <= prevLimit) {
          if (d.prev.entradas === null) d.prev.entradas = 0;
          if (d.prev.saidas === null) d.prev.saidas = 0;
          if (d.prev.saldo === null) d.prev.saldo = 0;
        }

        if (d.curr.entradas !== null || d.curr.saidas !== null) {
          d.curr.saldo = (d.curr.entradas || 0) - (d.curr.saidas || 0);
          if (d.curr.entradas && d.curr.entradas > maxVal) maxVal = d.curr.entradas;
          if (d.curr.saidas && d.curr.saidas > maxVal) maxVal = d.curr.saidas;
          if (Math.abs(d.curr.saldo) > maxVal) maxVal = Math.abs(d.curr.saldo);
        }
        if (d.prev.entradas !== null || d.prev.saidas !== null) {
          d.prev.saldo = (d.prev.entradas || 0) - (d.prev.saidas || 0);
          if (d.prev.entradas && d.prev.entradas > maxVal) maxVal = d.prev.entradas;
          if (d.prev.saidas && d.prev.saidas > maxVal) maxVal = d.prev.saidas;
          if (Math.abs(d.prev.saldo) > maxVal) maxVal = Math.abs(d.prev.saldo);
        }
      });
  
      return { data: monthsData, max: maxVal || 1 };
    }, [chartTransactions, chartYear]);

  const buildHistoricoLinePath = (key: 'entradas' | 'saidas' | 'saldo', isPrev: boolean = false) => {
    if (historicoMensal.data.length === 0) return '';
    if (hiddenHistoricoLines.includes(key)) return '';
    const points = historicoMensal.data.map((d: any, i) => {
      const target = isPrev ? d.prev : d.curr;
      const val = target[key as keyof typeof target] as number | null;
      if (val === null) return null;
      const x = (i / 11) * 100;
      
      let y = 90 - (val / historicoMensal.max) * 80;
      if (key === 'saldo') {
        y = 50 - (val / historicoMensal.max) * 40;
      }
      if (y > 95) y = 95; // Limit floor
      if (y < 5) y = 5;   // Limit ceiling
      
      return { x, y };
    });

    const segments: {x:number, y:number}[][] = [];
    let currentSegment: {x:number, y:number}[] = [];
    for (const pt of points) {
      if (pt) {
        currentSegment.push(pt);
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    let path = '';
    for (const segment of segments) {
      if (segment.length === 0) continue;
      if (segment.length === 1) {
        path += `M ${segment[0].x},${segment[0].y} `;
        continue;
      }
      path += `M ${segment[0].x},${segment[0].y} `;
      for (let i = 0; i < segment.length - 1; i++) {
        const p0 = segment[i === 0 ? 0 : i - 1];
        const p1 = segment[i];
        const p2 = segment[i + 1];
        const p3 = segment[i + 2 < segment.length ? i + 2 : i + 1];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
      }
    }
    return path;
  };

  // 6. Gráfico Detalhamento: Saídas por Categoria
  const saidasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    let max = 0;
    filteredTransactions.filter(t => t.type === 'despesa').forEach(t => {
      const current = map.get(t.category) || 0;
      const newVal = current + t.amount;
      map.set(t.category, newVal);
      if (newVal > max) max = newVal;
    });
    return { data: Array.from(map.entries()).sort((a,b) => b[1] - a[1]), max };
  }, [filteredTransactions]);

  // 7. NOVO: Ranking de Entradas por Membro
  const rankingMembros = useMemo(() => {
    const map = new Map<string, number>();
    
    selectedDiaTransactions.filter(t => t.type === 'receita' && t.status === 'confirmado' && t.memberId).forEach(t => {
      const current = map.get(t.memberId!) || 0;
      map.set(t.memberId!, current + t.amount);
    });

    const data = Array.from(map.entries()).map(([memberId, totalAmount]) => {
      const member = members.find(m => m.id === memberId);
      return {
        memberId,
        name: member ? member.name : 'Membro Desconhecido',
        photo: null,
        amount: totalAmount
      };
    }).sort((a, b) => b.amount - a.amount);
    
    const maxAmount = Math.max(0, ...data.map(d => d.amount));
    return { data, max: maxAmount };
  }, [selectedDiaTransactions, members]);

  // Análise Geral
  const totalReceitas = receitasCultoData.total;
  const totalDespesas = saidasPorCategoria.data.reduce((acc, [, val]) => acc + val, 0);
  const saldo = totalReceitas - totalDespesas;
  
  const maiorReceita = receitasPorCategoria.data.length > 0 ? receitasPorCategoria.data[0] : null;
  const maiorDespesa = saidasPorCategoria.data.length > 0 ? saidasPorCategoria.data[0] : null;

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '14px', paddingBottom: '20px', overflowY: 'auto', paddingRight: '8px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>📈 Dashboard Financeiro</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Análise detalhada do financeiro</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(canSeeAllChurches || isPastorRegional) ? (
            <select value={church} onChange={e => setChurch(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
              <option value="ALL">Todas as Igrejas</option>
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="search-input glass-input" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.8, pointerEvents: 'none' }}>
              {churches.find(c => c.id === church)?.name || 'Igreja Local'}
            </div>
          )}
          <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
            <option value="ALL">Todos os Cultos</option>
            {availableCultos.map((name: any) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
            <option value="ALL">Todos os Horários</option>
            {availableHorarios.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="search-input glass-input" style={{ padding: '5px 10px', fontSize: '0.8rem', colorScheme: 'dark' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="search-input glass-input" style={{ padding: '5px 10px', fontSize: '0.8rem', colorScheme: 'dark' }} />
          </div>
          {(church !== (canSeeAllChurches || isPastorRegional ? 'ALL' : (currentUser?.churchId || 'ALL')) || cultoFilter !== 'ALL' || horarioFilter !== 'ALL' || startDate !== firstDayStr || endDate !== lastDayStr) && (
            <button 
              onClick={() => {
                if (canSeeAllChurches || isPastorRegional) setChurch('ALL');
                setCultoFilter('ALL');
                setHorarioFilter('ALL');
                setStartDate(firstDayStr);
                setEndDate(lastDayStr);
              }}
              style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', transition: 'all 0.2s', height: '33px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.15)'}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', flexShrink: 0 }}>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>💵 Receitas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2ecc71', margin: '4px 0' }}>{formatCurrency(receitas)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{startDate || endDate ? 'No período selecionado' : 'Todo o histórico'}</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>📉 Despesas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e74c3c', margin: '4px 0' }}>{formatCurrency(despesas)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{startDate || endDate ? 'No período selecionado' : 'Todo o histórico'}</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f1c40f' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>💼 Saldo</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1c40f', margin: '4px 0' }}>{formatCurrency(kpiSaldo)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Receitas - Despesas</div>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f1c40f' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>📊 Dízimos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1c40f', margin: '4px 0' }}>{formatCurrency(dizimos)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{dizimosPercent.toFixed(1)}% do total de receitas</div>
        </div>
      </div>

      {/* LINHA 1: ENTRADAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', flexShrink: 0 }}>
        <DonutChart 
          title="✝️ Entradas por Dia" 
          data={receitasCultoData.slices} 
          total={receitasCultoData.total} 
          formatCenterTotal={formatShortCurrency}
          formatValue={formatCurrency}
          activeSlice={selectedDia}
          onClickSlice={(key) => setSelectedDia(prev => prev === key ? null : key)}
        />
        <DonutChart title="🕒 Entradas por Horário" data={receitasHorarioData.slices} total={receitasHorarioData.total} formatCenterTotal={formatShortCurrency} formatValue={formatCurrency} />
        
        {/* Detalhamento Entradas */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h4 style={{ fontSize: '0.85rem', margin: '0 0 16px 0', color: '#2ecc71' }}>🟢 Detalhamento de Entradas (Por Categoria)</h4>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {receitasPorCategoria.data.slice(0, showAllEntradas ? undefined : 5).map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ width: `${receitasPorCategoria.max > 0 ? (val / receitasPorCategoria.max) * 100 : 0}%`, height: '100%', backgroundColor: '#2ecc71', borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
            {receitasPorCategoria.data.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum registro.</div>}
            {receitasPorCategoria.data.length > 5 && (
              <button 
                onClick={() => setShowAllEntradas(!showAllEntradas)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none', padding: '8px', fontSize: '0.75rem', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {showAllEntradas ? 'Ver menos' : `Ver mais (${receitasPorCategoria.data.length - 5})`}
              </button>
            )}
          </div>
        </div>
        <DonutChart title="💳 Formas de Pgto (Entradas)" data={pagamentosReceitaData.slices} total={pagamentosReceitaData.total} formatCenterTotal={formatShortCurrency} formatValue={formatCurrency} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', flexShrink: 0, marginTop: '14px' }}>
        
        {/* Detalhamento Saídas */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h4 style={{ fontSize: '0.85rem', margin: '0 0 16px 0', color: '#e74c3c' }}>🔴 Detalhamento de Saídas (Por Categoria)</h4>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {saidasPorCategoria.data.slice(0, showAllSaidas ? undefined : 5).map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ width: `${saidasPorCategoria.max > 0 ? (val / saidasPorCategoria.max) * 100 : 0}%`, height: '100%', backgroundColor: '#e74c3c', borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
            {saidasPorCategoria.data.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum registro.</div>}
            {saidasPorCategoria.data.length > 5 && (
              <button 
                onClick={() => setShowAllSaidas(!showAllSaidas)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none', padding: '8px', fontSize: '0.75rem', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {showAllSaidas ? 'Ver menos' : `Ver mais (${saidasPorCategoria.data.length - 5})`}
              </button>
            )}
          </div>
        </div>

        <DonutChart title="💸 Formas de Pgto (Saídas)" data={pagamentosSaidaData.slices} total={pagamentosSaidaData.total} formatCenterTotal={formatShortCurrency} formatValue={formatCurrency} />

        {/* Ranking de Entradas por Membro */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h4 style={{ fontSize: '0.85rem', margin: '0 0 16px 0', color: '#f1c40f' }}>🏆 Ranking de Entradas por Membro</h4>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {rankingMembros.data.slice(0, showAllRanking ? undefined : 5).map((r, i) => (
              <div key={r.memberId} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.75rem' }}>{i + 1}. {r.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#2ecc71', fontSize: '0.75rem' }}>{formatCurrency(r.amount)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ width: `${rankingMembros.max > 0 ? (r.amount / rankingMembros.max) * 100 : 0}%`, height: '100%', backgroundColor: '#f1c40f', borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
            {rankingMembros.data.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum dado encontrado.</div>}
            {rankingMembros.data.length > 5 && (
              <button 
                onClick={() => setShowAllRanking(!showAllRanking)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none', padding: '8px', fontSize: '0.75rem', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {showAllRanking ? 'Ver menos' : `Ver mais (${rankingMembros.data.length - 5})`}
              </button>
            )}
          </div>
        </div>
        
      </div>
      {/* GRUPO DOS 3 GRÁFICOS DE EVOLUÇÃO (LADO A LADO) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
         <h3 style={{ fontSize: '1.2rem', margin: 0 }}>📊 Visão Anual e Comparativo (YoY)</h3>
         <select value={chartYear} onChange={e => setChartYear(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
         </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', flexShrink: 0 }}>
        
        {/* GRÁFICO 1: EVOLUÇÃO MENSAL DE CULTOS */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0' }}>📈 Crescimento Comparativo Mensal</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evolução de arrecadação dos cultos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px' }}>
                <button 
                  onClick={() => setEvolucaoChartType('barra')} 
                  style={{ background: evolucaoChartType === 'barra' ? 'var(--primary-light)' : 'transparent', color: '#fff', border: 'none', padding: '2px 8px', fontSize: '0.65rem', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.3s' }}
                >Barras</button>
                <button 
                  onClick={() => setEvolucaoChartType('linha')} 
                  style={{ background: evolucaoChartType === 'linha' ? 'var(--primary-light)' : 'transparent', color: '#fff', border: 'none', padding: '2px 8px', fontSize: '0.65rem', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.3s' }}
                >Linha</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.65rem', flexWrap: 'wrap' }}>
                {evolucaoCultos.cultos.map((culto: string, idx: number) => {
                  const isHidden = hiddenEvolucaoLines.includes(culto);
                  return (
                    <div key={culto} style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', opacity: isHidden ? 0.4 : 1 }} onClick={() => toggleEvolucaoLine(culto)}>
                      <div style={{ width: '8px', height: '8px', background: getCultoColor(idx), borderRadius: '2px' }}/> {culto}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', opacity: hiddenEvolucaoLines.includes('Outros') ? 0.4 : 1 }} onClick={() => toggleEvolucaoLine('Outros')}>
                  <div style={{ width: '8px', height: '8px', background: '#888888', borderRadius: '2px' }}/> Outros
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', opacity: showCompareCultos ? 1 : 0.4, marginLeft: '6px' }} onClick={() => setShowCompareCultos(!showCompareCultos)}>
                  <div style={{ width: '8px', height: '8px', border: '1px solid #fff', borderRadius: '2px' }}/> vs {parseInt(chartYear) - 1}
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {evolucaoChartType === 'barra' ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1, gap: '4px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {evolucaoCultos.data.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2px', height: '100%' }}>
                    {evolucaoCultos.cultos.map((culto: string, idx: number) => (
                      d.curr[culto] != null && <div key={culto} style={{ width: '6px', height: `${(d.curr[culto]! / evolucaoCultos.max) * 90}%`, background: getCultoColor(idx), borderRadius: '2px 2px 0 0', transition: 'height 0.4s' }} title={`${culto}: ${formatShortCurrency(d.curr[culto]!)}`} />
                    ))}
                    {d.curr['Outros'] != null && <div key="Outros" style={{ width: '6px', height: `${(d.curr['Outros']! / evolucaoCultos.max) * 90}%`, background: '#888888', borderRadius: '2px 2px 0 0', transition: 'height 0.4s' }} title={`Outros: ${formatShortCurrency(d.curr['Outros']!)}`} />}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ position: 'relative', flex: 1, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                  {showCompareCultos && (
                    <>
                      {evolucaoCultos.cultos.map((culto: string, idx: number) => (
                        <path key={`prev-${culto}`} d={buildEvolucaoLinePath(culto, true)} fill="none" stroke={getCultoColor(idx)} strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                      ))}
                      <path d={buildEvolucaoLinePath('Outros', true)} fill="none" stroke="#888888" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                    </>
                  )}
                  {evolucaoCultos.cultos.map((culto: string, idx: number) => (
                    <path key={`curr-${culto}`} d={buildEvolucaoLinePath(culto)} fill="none" stroke={getCultoColor(idx)} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  ))}
                  <path d={buildEvolucaoLinePath('Outros')} fill="none" stroke="#888888" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                </svg>
                
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {evolucaoCultos.data.map((d, i) => {
                    const isHovered = evolucaoHoveredMonthIdx === i;
                    return (
                      <div 
                        key={i} 
                        style={{ flex: 1, position: 'relative', cursor: 'crosshair' }}
                        onMouseEnter={() => setEvolucaoHoveredMonthIdx(i)}
                        onMouseLeave={() => setEvolucaoHoveredMonthIdx(null)}
                      >
                        {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                      </div>
                    );
                  })}
                </div>

                {evolucaoCultos.data.map((d, i) => {
                  const left = `${(i / 11) * 100}%`;
                  const isHovered = evolucaoHoveredMonthIdx === i;
                  
                  const cultosWithData = [...evolucaoCultos.cultos, 'Outros'].filter(c => d.curr[c] != null);
                  const hasNoData = cultosWithData.length === 0;

                  return (
                    <div key={`dots-${i}`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                      {evolucaoCultos.cultos.map((culto: string, idx: number) => {
                        if (d.curr[culto] == null) return null;
                        const top = `${90 - (d.curr[culto]! / evolucaoCultos.max) * 80}%`;
                        return (
                          <div key={`dot-${culto}`} style={{ position: 'absolute', top, width: isHovered ? '12px' : '8px', height: isHovered ? '12px' : '8px', background: getCultoColor(idx), borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #1a1a2e', boxShadow: isHovered ? `0 0 8px ${getCultoColor(idx)}` : 'none', zIndex: 10 - idx, transition: 'all 0.2s' }} />
                        );
                      })}
                      {d.curr['Outros'] != null && (
                        <div key="dot-Outros" style={{ position: 'absolute', top: `${90 - (d.curr['Outros']! / evolucaoCultos.max) * 80}%`, width: isHovered ? '12px' : '8px', height: isHovered ? '12px' : '8px', background: '#888888', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #1a1a2e', boxShadow: isHovered ? `0 0 8px #888888` : 'none', zIndex: 0, transition: 'all 0.2s' }} />
                      )}
                      
                      {isHovered && (
                        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{d.monthStr}</div>
                          {evolucaoCultos.cultos.map((culto: string, idx: number) => {
                            if (d.curr[culto] == null) return null;
                            return (
                              <div key={`tt-${culto}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '8px', height: '8px', background: getCultoColor(idx), borderRadius: '2px' }} />
                                  <span style={{ color: '#fff' }}>{culto}</span>
                                </div>
                                <strong>{formatShortCurrency(d.curr[culto]!)}</strong>
                              </div>
                            );
                          })}
                          {d.curr['Outros'] != null && (
                            <div key="tt-Outros" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#888888', borderRadius: '2px' }} />
                                <span style={{ color: '#fff' }}>Outros</span>
                              </div>
                              <strong>{formatShortCurrency(d.curr['Outros']!)}</strong>
                            </div>
                          )}
                          {hasNoData && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados em {chartYear}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              {evolucaoCultos.data.map((d, i) => (
                <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>{d.monthStr}</div>
              ))}
            </div>
          </div>
        </div>
        
        {/* GRÁFICO 2: Histórico de Entradas e Saídas */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0', color: '#2ecc71' }}>🟢 Histórico de Entradas e Saídas</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evolução do período</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: hiddenHistoricoLines.includes('entradas') ? 0.4 : 1 }} onClick={() => toggleHistoricoLine('entradas')}>
                <div style={{ width: '8px', height: '8px', background: '#2ecc71', borderRadius: '2px' }}/> Entradas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: hiddenHistoricoLines.includes('saidas') ? 0.4 : 1 }} onClick={() => toggleHistoricoLine('saidas')}>
                <div style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '2px' }}/> Saídas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: showCompareEntradas ? 1 : 0.4, marginLeft: '6px' }} onClick={() => setShowCompareEntradas(!showCompareEntradas)}>
                <div style={{ width: '8px', height: '8px', border: '1px solid #fff', borderRadius: '2px' }}/> vs {parseInt(chartYear) - 1}
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <div style={{ width: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)', paddingBottom: '20px', flexShrink: 0 }}>
              <span>{formatShortCurrency(historicoMensal.max)}</span>
              <span>{formatShortCurrency(historicoMensal.max / 2)}</span>
              <span>0</span>
            </div>

            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', flex: 1, flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
                <div style={{ position: 'absolute', top: '90%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                  {showCompareEntradas && (
                    <>
                      <path d={buildHistoricoLinePath('entradas', true)} fill="none" stroke="#2ecc71" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                      <path d={buildHistoricoLinePath('saidas', true)} fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                    </>
                  )}
                  <path d={buildHistoricoLinePath('entradas')} fill="none" stroke="#2ecc71" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  <path d={buildHistoricoLinePath('saidas')} fill="none" stroke="#e74c3c" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                </svg>
                
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {historicoMensal.data.map((d, i) => {
                    const isHovered = evolucaoHoveredMonthIdx === i;
                    return (
                      <div 
                        key={i} 
                        style={{ flex: 1, position: 'relative', cursor: 'crosshair' }}
                        onMouseEnter={() => setEvolucaoHoveredMonthIdx(i)}
                        onMouseLeave={() => setEvolucaoHoveredMonthIdx(null)}
                      >
                        {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                      </div>
                    );
                  })}
                </div>

                {historicoMensal.data.map((d, i) => {
                  const left = `${(i / 11) * 100}%`;
                  const topEnt = d.curr.entradas !== null ? `${90 - (d.curr.entradas / historicoMensal.max) * 80}%` : null;
                  const topSai = d.curr.saidas !== null ? `${90 - (d.curr.saidas / historicoMensal.max) * 80}%` : null;
                  const isHovered = evolucaoHoveredMonthIdx === i;
                  return (
                    <div key={`dots-ent-${i}`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                      {topEnt && <div style={{ position: 'absolute', top: topEnt, width: isHovered ? '12px' : '8px', height: isHovered ? '12px' : '8px', background: '#2ecc71', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #1a1a2e', boxShadow: isHovered ? '0 0 8px #2ecc71' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                      {topSai && <div style={{ position: 'absolute', top: topSai, width: isHovered ? '12px' : '8px', height: isHovered ? '12px' : '8px', background: '#e74c3c', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #1a1a2e', boxShadow: isHovered ? '0 0 8px #e74c3c' : 'none', zIndex: 2, transition: 'all 0.2s' }} />}
                      
                      {isHovered && (
                        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.monthStr}</div>
                          {d.curr.entradas !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#2ecc71', borderRadius: '2px' }} />
                                <span style={{ color: '#fff' }}>Entradas:</span>
                              </div>
                              <strong>{formatShortCurrency(d.curr.entradas)}</strong>
                            </div>
                          )}
                          {d.curr.saidas !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '2px' }} />
                                <span style={{ color: '#fff' }}>Saídas:</span>
                              </div>
                              <strong>{formatShortCurrency(d.curr.saidas)}</strong>
                            </div>
                          )}
                          {d.curr.entradas === null && d.curr.saidas === null && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados em {chartYear}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {historicoMensal.data.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>{d.monthStr}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO 3: Histórico de Saldo */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0', color: '#f1c40f' }}>🟡 Histórico de Saldo</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evolução do Saldo Líquido no período</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: hiddenHistoricoLines.includes('saldo') ? 0.4 : 1 }} onClick={() => toggleHistoricoLine('saldo')}>
                <div style={{ width: '8px', height: '8px', background: '#f1c40f', borderRadius: '2px' }}/> Saldo Atual
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: showCompareSaldo ? 1 : 0.4, marginLeft: '6px' }} onClick={() => setShowCompareSaldo(!showCompareSaldo)}>
                <div style={{ width: '8px', height: '8px', border: '1px solid #fff', borderRadius: '2px' }}/> vs {parseInt(chartYear) - 1}
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <div style={{ width: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)', paddingBottom: '20px', flexShrink: 0 }}>
              <span>{formatShortCurrency(historicoMensal.max)}</span>
              <span>0</span>
              <span>{formatShortCurrency(-historicoMensal.max)}</span>
            </div>

            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', flex: 1, flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.2)' }}></div>
                <div style={{ position: 'absolute', top: '90%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                  {showCompareSaldo && (
                    <path d={buildHistoricoLinePath('saldo', true)} fill="none" stroke="#f1c40f" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  )}
                  <path d={buildHistoricoLinePath('saldo')} fill="none" stroke="#f1c40f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                </svg>
                
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {historicoMensal.data.map((d, i) => {
                    const isHovered = evolucaoHoveredMonthIdx === i;
                    return (
                      <div 
                        key={i} 
                        style={{ flex: 1, position: 'relative', cursor: 'crosshair' }}
                        onMouseEnter={() => setEvolucaoHoveredMonthIdx(i)}
                        onMouseLeave={() => setEvolucaoHoveredMonthIdx(null)}
                      >
                        {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                      </div>
                    );
                  })}
                </div>

                {historicoMensal.data.map((d, i) => {
                  const left = `${(i / 11) * 100}%`;
                  
                  let topSai = null;
                  if (d.curr.saldo !== null) {
                    let y = 50 - (d.curr.saldo / historicoMensal.max) * 40;
                    if (y > 95) y = 95;
                    if (y < 5) y = 5;
                    topSai = `${y}%`;
                  }
                  
                  const isHovered = evolucaoHoveredMonthIdx === i;
                  return (
                    <div key={`dots-sai-${i}`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                      {topSai && <div style={{ position: 'absolute', top: topSai, width: isHovered ? '12px' : '8px', height: isHovered ? '12px' : '8px', background: '#f1c40f', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #1a1a2e', boxShadow: isHovered ? '0 0 8px #f1c40f' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                      
                      {isHovered && (
                        <div style={{ position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.monthStr}</div>
                          {d.curr.saldo !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                              <div style={{ width: '8px', height: '8px', background: '#f1c40f', borderRadius: '2px' }} />
                              <span style={{ color: '#fff' }}>Saldo:</span> <strong>{formatShortCurrency(d.curr.saldo)}</strong>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados em {chartYear}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {historicoMensal.data.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>{d.monthStr}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
