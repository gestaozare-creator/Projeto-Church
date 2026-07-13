import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing admin keys" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const churchId = searchParams.get('churchId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || new Date().getMonth().toString();

    if (!churchId) {
      return NextResponse.json({ error: "churchId is required" }, { status: 400 });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Manually construct YYYY-MM-DD strings to avoid UTC timezone shifts
    const monthFormatted = (monthNum + 1).toString().padStart(2, '0');
    const startDateStr = `${yearNum}-${monthFormatted}-01`;
    // Find the last day of the month by rolling back 1 day from the next month
    const nextMonth = monthNum + 1 > 11 ? 0 : monthNum + 1;
    const nextMonthYear = monthNum + 1 > 11 ? yearNum + 1 : yearNum;
    const lastDay = new Date(nextMonthYear, nextMonth, 0).getDate();
    const endDateStr = `${yearNum}-${monthFormatted}-${lastDay.toString().padStart(2, '0')}`;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Church Name, Logo, and Pastor
    const { data: churchData } = await supabaseAdmin
      .from('churches')
      .select('name, logo_url, ministry_id, pastor_name')
      .eq('id', churchId)
      .single();

    let ministryLogo = '';
    if (churchData?.ministry_id && !churchData?.logo_url) {
      const { data: minData } = await supabaseAdmin
        .from('ministries')
        .select('logo_url')
        .eq('id', churchData.ministry_id)
        .single();
      ministryLogo = minData?.logo_url || '';
    }

    const churchName = churchData?.name || 'Igreja';
    const churchLogo = churchData?.logo_url || ministryLogo || '';
    const pastorName = churchData?.pastor_name || 'Responsável';

    // 1. Fetch Members (Excluding Visitors)
    const { data: members, error: memError } = await supabaseAdmin
      .from('members')
      .select('id, name, phone, integration_date, created_at, status, culto, horario, function')
      .eq('church_id', churchId)
      .neq('function', 'Visitante');

    if (memError) throw memError;

    const filteredMembers = members?.filter((m: any) => {
      const dateStr = m.integration_date || m.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === yearNum && d.getMonth() === monthNum;
    }) || [];

    // 2. Fetch Visitors (From members table where function = 'Visitante')
    const { data: visitors, error: visError } = await supabaseAdmin
      .from('members')
      .select('id, name, phone, created_at, status, culto, horario, function')
      .eq('church_id', churchId)
      .eq('function', 'Visitante');

    if (visError) throw visError;

    const filteredVisitors = visitors?.filter((v: any) => {
      const dateStr = v.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === yearNum && d.getMonth() === monthNum;
    }) || [];

    // 3. Fetch Transactions
    const { data: transactions, error: transError } = await supabaseAdmin
      .from('transactions')
      .select('id, amount, type, date, status, description, category, payment_method, member_id, supplier_id')
      .eq('church_id', churchId)
      .in('status', ['PAID', 'confirmado', 'pago', 'realizado'])
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (transError) throw transError;

    return NextResponse.json({ 
      success: true, 
      churchName,
      churchLogo,
      pastorName,
      members: filteredMembers,
      visitors: filteredVisitors,
      transactions: transactions || []
    });

  } catch (error: any) {
    console.error("API Error fetching relatorios data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
