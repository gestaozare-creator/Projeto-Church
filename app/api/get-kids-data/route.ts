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

    if (!churchId) {
      return NextResponse.json({ error: "churchId is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch kids filtered by churchId
    const { data: kids, error: kidsError } = await supabaseAdmin
      .from('kids')
      .select('*')
      .eq('church_id', churchId);
      
    if (kidsError) throw kidsError;
    
    // Fetch active checkins filtered by churchId
    const { data: checkins, error: checkinsError } = await supabaseAdmin
      .from('kids_checkin')
      .select('*, kids(*)')
      .eq('church_id', churchId)
      .eq('status', 'presente');
      
    if (checkinsError) throw checkinsError;

    // Fetch church config for the specific church
    const { data: firstChurch, error: churchError } = await supabaseAdmin
      .from('churches')
      .select('id, config')
      .eq('id', churchId)
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
