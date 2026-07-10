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
    
    // Fetch members of this church to find kids by parent
    const { data: members } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('church_id', churchId);
      
    const memberIds = members ? members.map(m => m.id) : [];

    // Fetch kids_checkin to find visitor kids
    const { data: checkinIds } = await supabaseAdmin
      .from('kids_checkin')
      .select('kid_id')
      .eq('church_id', churchId);
      
    const visitorKidIds = checkinIds ? checkinIds.map(c => c.kid_id).filter(id => id) : [];

    // Combine kids from parents and checkins
    let kids: any[] = [];
    
    if (memberIds.length > 0) {
      // Fetch kids of members in chunks of 100 to avoid URL too long
      const chunk = memberIds.slice(0, 100);
      const { data: pKids } = await supabaseAdmin.from('kids').select('*').in('parent_id', chunk);
      if (pKids) kids = [...kids, ...pKids];
    }
    
    if (visitorKidIds.length > 0) {
      const chunk = visitorKidIds.slice(0, 100);
      const { data: vKids } = await supabaseAdmin.from('kids').select('*').in('id', chunk);
      if (vKids) {
        // filter out kids already added
        const existingIds = new Set(kids.map(k => k.id));
        const newKids = vKids.filter(k => !existingIds.has(k.id));
        kids = [...kids, ...newKids];
      }
    }
    
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
