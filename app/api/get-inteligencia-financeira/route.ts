import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export async function GET(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing admin keys" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year') || new Date().getFullYear().toString();
    const monthStr = searchParams.get('month') || new Date().getMonth().toString();

    const monthNum = parseInt(monthStr, 10);
    const yearNum = parseInt(yearStr, 10);
    
    // Mes Atual Limites
    const currentMonthFormatted = (monthNum + 1).toString().padStart(2, '0');
    const startCurrentStr = `${yearNum}-${currentMonthFormatted}-01`;
    const nextMonth1 = monthNum + 1 > 11 ? 0 : monthNum + 1;
    const nextMonthYear1 = monthNum + 1 > 11 ? yearNum + 1 : yearNum;
    const lastDayCurrent = new Date(nextMonthYear1, nextMonth1, 0).getDate();
    const endCurrentStr = `${yearNum}-${currentMonthFormatted}-${lastDayCurrent.toString().padStart(2, '0')}`;

    // 12 meses atrás
    const d12 = new Date(yearNum, monthNum - 11, 1);
    const start12MonthsAgoStr = `${d12.getFullYear()}-${(d12.getMonth() + 1).toString().padStart(2, '0')}-01`;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all churches
    const { data: churches } = await supabaseAdmin
      .from('churches')
      .select('id, name, logo_url')
      .order('name');

    if (!churches || churches.length === 0) {
      return NextResponse.json({ success: true, churchesData: [], globalData: {}, historyData: [] });
    }

    const churchIds = churches.map(c => c.id);

    // Fetch transactions for the last 12 months
    const { data: allTransactions } = await supabaseAdmin
      .from('transactions')
      .select('amount, type, date, status, description, category, church_id')
      .in('church_id', churchIds)
      .gte('date', start12MonthsAgoStr)
      .lte('date', endCurrentStr);

    const todayStr = new Date().toISOString().split('T')[0];
    const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

    const extractDayTimeFromTransaction = (t: any): string => {
      let dayOfWeek = '';
      if (t.date) {
        const d = new Date(t.date + 'T12:00:00Z');
        if (!isNaN(d.getTime())) {
          dayOfWeek = daysOfWeek[d.getUTCDay()];
        }
      }
      const isCulto = t.category?.toLowerCase().includes('culto') || t.description?.toLowerCase().includes('culto');
      if (!isCulto) return 'Outras Entradas';
      if (!dayOfWeek) return 'Cultos Sem Data';
      return dayOfWeek;
    };

    let globalReceita = 0;
    let globalDespesa = 0;
    let globalReceitaPrev = 0; // Para MoM
    let globalEntradasCount = 0;

    // Inicializa histórico mensal (12 meses até o atual)
    const historyMap: Record<string, { monthName: string, sortKey: string, receitas: number, despesas: number, entradasCount: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(yearNum, monthNum - i, 1);
      const k = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      historyMap[k] = {
        monthName: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        sortKey: k,
        receitas: 0,
        despesas: 0,
        entradasCount: 0
      };
    }

    const prevMonthNum = monthNum - 1 < 0 ? 11 : monthNum - 1;
    const prevYearNum = monthNum - 1 < 0 ? yearNum - 1 : yearNum;
    const prevKey = `${prevYearNum}-${(prevMonthNum + 1).toString().padStart(2, '0')}`;
    const currKey = `${yearNum}-${(monthNum + 1).toString().padStart(2, '0')}`;

    const churchesData = churches.map(church => {
      const cId = church.id;
      const tChurch = (allTransactions || []).filter(t => t.church_id === cId);

      let receitaAtual = 0;
      let despesaAtual = 0;
      let receitaAnterior = 0;
      let entradasCount = 0;
      let contasVencidas = 0;
      let contasVencidasValor = 0;
      let contasAPagar = 0;
      let contasAPagarValor = 0;

      const cultosMap: Record<string, number> = {};

      tChurch.forEach(t => {
        const amt = Number(t.amount);
        const isIncome = t.type === 'INCOME' || t.type === 'receita';
        const isExpense = t.type === 'EXPENSE' || t.type === 'despesa';
        const isPaid = ['PAID', 'confirmado', 'pago', 'realizado'].includes(t.status?.toLowerCase() || '');
        const isPending = ['PENDING', 'pendente', 'a_pagar'].includes(t.status?.toLowerCase() || '');
        
        if (!t.date) return;
        const tMonthKey = t.date.substring(0, 7); // YYYY-MM

        // Somar ao histórico global
        if (historyMap[tMonthKey]) {
          if (isIncome && isPaid) {
            historyMap[tMonthKey].receitas += amt;
            historyMap[tMonthKey].entradasCount++;
          }
          if (isExpense && isPaid) {
            historyMap[tMonthKey].despesas += amt;
          }
        }

        // Dados do mês atual da igreja
        if (tMonthKey === currKey) {
          if (isIncome && isPaid) {
            receitaAtual += amt;
            entradasCount++;
            
            const cultoKey = extractDayTimeFromTransaction(t);
            if (!cultosMap[cultoKey]) cultosMap[cultoKey] = 0;
            cultosMap[cultoKey] += amt;
          }
          if (isExpense) {
            if (isPaid) {
              despesaAtual += amt;
            } else if (isPending) {
              if (t.date < todayStr) {
                contasVencidas++;
                contasVencidasValor += amt;
              } else {
                contasAPagar++;
                contasAPagarValor += amt;
              }
            }
          }
        }

        // Dados do mês anterior da igreja (MoM local/global)
        if (tMonthKey === prevKey) {
          if (isIncome && isPaid) {
            receitaAnterior += amt;
          }
        }
      });

      globalReceita += receitaAtual;
      globalDespesa += despesaAtual;
      globalReceitaPrev += receitaAnterior;
      globalEntradasCount += entradasCount;

      const cultosList = Object.keys(cultosMap)
        .map(k => ({ name: k, value: cultosMap[k] }))
        .sort((a, b) => b.value - a.value);

      return {
        id: church.id,
        name: church.name,
        logo: church.logo_url,
        receitaAtual,
        despesaAtual,
        saldoAtual: receitaAtual - despesaAtual,
        receitaAnterior,
        entradasCount,
        ticketMedio: entradasCount > 0 ? receitaAtual / entradasCount : 0,
        contasVencidas,
        contasVencidasValor,
        contasAPagar,
        contasAPagarValor,
        cultos: cultosList
      };
    });

    const globalTicketMedio = globalEntradasCount > 0 ? globalReceita / globalEntradasCount : 0;
    const globalGrowth = globalReceitaPrev > 0 ? ((globalReceita - globalReceitaPrev) / globalReceitaPrev) * 100 : 0;

    const historyData = Object.values(historyMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(h => ({
      name: h.monthName,
      receitas: h.receitas,
      despesas: h.despesas,
      saldo: h.receitas - h.despesas,
      ticketMedio: h.entradasCount > 0 ? h.receitas / h.entradasCount : 0
    }));

    // Correção: Como iteramos por tChurch e somamos em historyMap para cada igreja,
    // transactions foram somadas repetidas vezes? NÃO! tChurch itera sobre transações de UMA igreja,
    // mas a mesma transação pertence a uma única igreja (filter). Então está seguro e correto!

    return NextResponse.json({ 
      success: true, 
      churchesData: churchesData.sort((a, b) => b.receitaAtual - a.receitaAtual),
      globalData: {
        receita: globalReceita,
        despesa: globalDespesa,
        saldo: globalReceita - globalDespesa,
        receitaPrev: globalReceitaPrev,
        growth: globalGrowth,
        ticketMedio: globalTicketMedio
      },
      historyData
    });

  } catch (error: any) {
    console.error("API Error Inteligencia Financeira:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
