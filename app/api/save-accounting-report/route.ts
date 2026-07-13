import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing admin keys" }, { status: 500 });
    }

    const body = await req.json();
    const { churchId, newReport } = body;

    if (!churchId || !newReport) {
      return NextResponse.json({ error: "churchId and newReport are required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current config
    const { data: churchData, error: fetchError } = await supabaseAdmin
      .from('churches')
      .select('config')
      .eq('id', churchId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const currentConfig = churchData?.config || {};
    const existingReports = currentConfig.accountingReports || [];

    // Remove any previous entry for this month/year and append the new one
    const updatedReports = [
      ...existingReports.filter((r: any) => !(r.month === newReport.month && r.year === newReport.year)),
      newReport
    ];

    // Save back
    const { error: updateError } = await supabaseAdmin
      .from('churches')
      .update({
        config: {
          ...currentConfig,
          accountingReports: updatedReports
        }
      })
      .eq('id', churchId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, accountingReports: updatedReports });
  } catch (error: any) {
    console.error("Error in save-accounting-report API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
