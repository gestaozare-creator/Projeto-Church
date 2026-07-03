import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing admin keys" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch kids
    const { data: kids, error: kidsError } = await supabaseAdmin
      .from('kids')
      .select('*');
      
    if (kidsError) throw kidsError;
    
    // Fetch active checkins
    const { data: checkins, error: checkinsError } = await supabaseAdmin
      .from('kids_checkin')
      .select('*, kids(*)')
      .eq('status', 'presente');
      
    if (checkinsError) throw checkinsError;

    // Fetch church config to get saved scales
    const { data: firstChurch, error: churchError } = await supabaseAdmin
      .from('churches')
      .select('id, config')
      .limit(1)
      .single();

    if (churchError && churchError.code !== 'PGRST116') {
      console.error("Error fetching church config:", churchError);
    }
    
    let churchConfig = {};
    if (firstChurch?.config) {
      if (typeof firstChurch.config === 'string') {
        try { churchConfig = JSON.parse(firstChurch.config); } catch (e) {}
      } else {
        churchConfig = firstChurch.config;
      }
    }

    return NextResponse.json({ 
      success: true, 
      kids, 
      checkins,
      churchId: firstChurch?.id,
      churchConfig
    });
  } catch (error: any) {
    console.error("API Error fetching kids data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
