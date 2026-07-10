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
    const { churchId, deptName, newEscalas } = await req.json();
    
    let targetChurchId = churchId;

    if (!targetChurchId || targetChurchId === '1') {
      return NextResponse.json({ error: "Invalid or missing churchId" }, { status: 400 });
    }
    
    // Fetch current config
    const { data: churchDb, error: fetchErr } = await supabaseAdmin
      .from('churches')
      .select('config')
      .eq('id', targetChurchId)
      .single();
      
    if (fetchErr) throw fetchErr;

    // O config pode vir como string JSON - precisamos parsear!
    let currentConfig: any = {};
    if (churchDb?.config) {
      if (typeof churchDb.config === 'string') {
        try { currentConfig = JSON.parse(churchDb.config); } catch { currentConfig = {}; }
      } else {
        currentConfig = churchDb.config;
      }
    }
    if (!currentConfig.escalas) currentConfig.escalas = {};
    currentConfig.escalas[deptName] = newEscalas;
    
    // Update config
    const { error: updateErr } = await supabaseAdmin
      .from('churches')
      .update({ config: currentConfig })
      .eq('id', targetChurchId);
      
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, savedTo: targetChurchId });
  } catch (error: any) {
    console.error("API Error saving scale:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
