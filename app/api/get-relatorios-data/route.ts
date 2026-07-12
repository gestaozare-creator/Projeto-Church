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

    if (!churchId) {
      return NextResponse.json({ error: "churchId is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Members for this church
    const { data: members, error: memError } = await supabaseAdmin
      .from('members')
      .select('id, integration_date, created_at')
      .eq('church_id', churchId);

    if (memError) throw memError;

    // 2. Fetch Visitors for this church
    const { data: visitors, error: visError } = await supabaseAdmin
      .from('visitors')
      .select('id, created_at')
      .eq('church_id', churchId);

    if (visError) throw visError;

    // 3. Fetch Transactions for this church for the specific year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: transactions, error: transError } = await supabaseAdmin
      .from('transactions')
      .select('id, amount, type, date, status, paid_date')
      .eq('church_id', churchId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (transError) throw transError;

    // Grouping logic (1 to 12)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i, // 0 to 11
      newMembers: 0,
      newVisitors: 0,
      income: 0,
      expense: 0
    }));

    // Process members
    members?.forEach((m: any) => {
      const dateStr = m.integration_date || m.created_at;
      if (dateStr && dateStr.startsWith(year)) {
        const month = new Date(dateStr).getMonth();
        if (month >= 0 && month <= 11) {
          monthlyData[month].newMembers += 1;
        }
      }
    });

    // Process visitors
    visitors?.forEach((v: any) => {
      const dateStr = v.created_at;
      if (dateStr && dateStr.startsWith(year)) {
        const month = new Date(dateStr).getMonth();
        if (month >= 0 && month <= 11) {
          monthlyData[month].newVisitors += 1;
        }
      }
    });

    // Process transactions
    transactions?.forEach((t: any) => {
      // consider date or paid_date, usually date is the reference month
      const dateStr = t.date;
      if (dateStr && dateStr.startsWith(year) && t.status === 'PAID') {
        const month = new Date(dateStr).getMonth();
        if (month >= 0 && month <= 11) {
          const amt = Number(t.amount) || 0;
          if (t.type === 'INCOME') {
            monthlyData[month].income += amt;
          } else if (t.type === 'EXPENSE') {
            monthlyData[month].expense += amt;
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: monthlyData });

  } catch (error: any) {
    console.error("API Error fetching relatorios data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
