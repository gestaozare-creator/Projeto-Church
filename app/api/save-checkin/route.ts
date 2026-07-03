import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing admin keys" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    
    // Check if it's an insert or an update
    if (body.action === 'checkout') {
      const { id, checkout_time, status } = body;
      const { data: updatedCheckin, error } = await supabaseAdmin
        .from('kids_checkin')
        .update({
          status: status || 'liberado',
          checkout_time: checkout_time || new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, checkin: updatedCheckin });
    } else {
      // It's a check-in
      const { kid_id, room, security_code, status, service_date, service_time } = body;
      const { data: newCheckin, error } = await supabaseAdmin
        .from('kids_checkin')
        .insert({
          kid_id: kid_id || null,
          room,
          security_code,
          status: status || 'presente',
          service_date,
          service_time
        })
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, checkin: newCheckin });
    }

  } catch (error: any) {
    console.error("API Error with kids_checkin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
