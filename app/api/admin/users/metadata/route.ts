import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Chave SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      return NextResponse.json({ error: `Erro ao buscar usuário: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      metadata: data.user?.user_metadata || {}
    });

  } catch (err: any) {
    return NextResponse.json({ error: `Erro inesperado no servidor: ${err.message}` }, { status: 500 });
  }
}
