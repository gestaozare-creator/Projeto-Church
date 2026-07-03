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
    const { id, name, birth_date, parent_id, emergency_contact, allergies } = await req.json();

    const { data: newKid, error } = await supabaseAdmin
      .from('kids')
      .insert({
        id,
        name,
        birth_date,
        parent_id: parent_id || null,
        emergency_contact,
        allergies: allergies || 'Sem alergias'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, kid: newKid });
  } catch (error: any) {
    console.error("API Error saving kid:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
