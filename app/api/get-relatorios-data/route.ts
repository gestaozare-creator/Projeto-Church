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
    
    // Calculate start and end dates for the selected month
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Church Name
    const { data: churchData } = await supabaseAdmin
      .from('churches')
      .select('name')
      .eq('id', churchId)
      .single();

    const churchName = churchData?.name || 'Igreja';

    // 1. Fetch Members
    const { data: members, error: memError } = await supabaseAdmin
      .from('members')
      .select('id, name, phone, integration_date, created_at, status, culto, horario')
      .eq('church_id', churchId);

    if (memError) throw memError;

    const filteredMembers = members?.filter((m: any) => {
      const dateStr = m.integration_date || m.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === yearNum && d.getMonth() === monthNum;
    }) || [];

    // 2. Fetch Visitors
    const { data: visitors, error: visError } = await supabaseAdmin
      .from('visitors')
      .select('id, name, phone, created_at, status, culto, horario')
      .eq('church_id', churchId)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr + 'T23:59:59');

    if (visError) throw visError;

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
      members: filteredMembers,
      visitors: visitors || [],
      transactions: transactions || []
    });

  } catch (error: any) {
    console.error("API Error fetching relatorios data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
