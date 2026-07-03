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

    // Se o churchId vier como '1' (fallback) mas não houver igreja com ID 1, pegamos a primeira igreja do banco
    if (churchId === '1') {
      const { data: firstChurch } = await supabaseAdmin.from('churches').select('id').limit(1).single();
      if (firstChurch) {
        targetChurchId = firstChurch.id;
      }
    }
    
    // Fetch current config
    const { data: churchDb, error: fetchErr } = await supabaseAdmin
      .from('churches')
      .select('config')
      .eq('id', targetChurchId)
      .single();
      
    if (fetchErr) throw fetchErr;

    const currentConfig = churchDb?.config || {};
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
