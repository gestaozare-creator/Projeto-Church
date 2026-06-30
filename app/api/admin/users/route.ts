import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cria um cliente do Supabase com a chave administrativa (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { action, email, password, name, role, churchId, userId } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Chave SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' }, { status: 500 });
    }

    // ─── CRIAR USUÁRIO ────────────────────────────────────────────────────────
    if (action === 'create') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'E-mail, senha e nome são obrigatórios.' }, { status: 400 });
      }

      // 1. Cria o usuário no Auth (com e-mail confirmado automaticamente)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, church_id: churchId }
      });

      if (authError) {
        return NextResponse.json({ error: `Erro no Auth: ${authError.message}` }, { status: 400 });
      }

      const uid = authUser.user?.id;
      if (!uid) {
        return NextResponse.json({ error: 'Não foi possível obter o ID do usuário criado.' }, { status: 500 });
      }

      // 2. Garante o registro na tabela user_roles
      const { error: dbError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          id: uid,
          email,
          name,
          role,
          church_id: churchId
        });

      if (dbError) {
        // Se falhar no banco, tenta remover do auth por consistência
        await supabaseAdmin.auth.admin.deleteUser(uid);
        return NextResponse.json({ error: `Erro ao salvar perfil no banco: ${dbError.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: authUser.user });
    }

    // ─── EDITAR USUÁRIO ───────────────────────────────────────────────────────
    if (action === 'update') {
      if (!userId || !name || !role) {
        return NextResponse.json({ error: 'ID do usuário, nome e nível de acesso são obrigatórios.' }, { status: 400 });
      }

      // 1. Atualiza dados na tabela user_roles
      const { error: dbError } = await supabaseAdmin
        .from('user_roles')
        .update({ name, role })
        .eq('id', userId);

      if (dbError) {
        return NextResponse.json({ error: `Erro ao atualizar banco: ${dbError.message}` }, { status: 400 });
      }

      // 2. Atualiza a senha no Auth se foi enviada
      const updateData: any = {
        user_metadata: { name, role }
      };
      if (password && password.length >= 6) {
        updateData.password = password;
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

      if (authError) {
        return NextResponse.json({ error: `Erro ao atualizar dados no Auth: ${authError.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // ─── DELETAR USUÁRIO ──────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
      }

      // 1. Remove do Auth (deleta a conta de verdade)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        return NextResponse.json({ error: `Erro ao remover conta no Auth: ${authError.message}` }, { status: 400 });
      }

      // 2. Remove da tabela user_roles
      const { error: dbError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('id', userId);

      if (dbError) {
        return NextResponse.json({ error: `Erro ao remover perfil do banco: ${dbError.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: `Erro inesperado no servidor: ${err.message}` }, { status: 500 });
  }
}
