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
    const { rooms } = await req.json();

    for (const room of rooms) {
      if (room.id) {
        const { error } = await supabaseAdmin
          .from('kids_rooms')
          .update({
            name: room.label,
            min_age: room.minAge,
            max_age: room.maxAge,
            capacity: room.capacity,
            max_kids_per_tio: room.maxKidsPerTio
          })
          .eq('id', room.id);

        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error saving kids rooms:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
