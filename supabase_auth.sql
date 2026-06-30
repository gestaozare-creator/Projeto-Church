-- ==============================================================================
-- CHURCHFLOW: AUTENTICAÇÃO E PERMISSÕES (SUPABASE)
-- Execute este script COMPLETO no painel SQL do Supabase.
-- Ele é idempotente — pode ser rodado mais de uma vez sem problema.
-- ==============================================================================

-- 1. Criação da tabela de perfis de usuário (user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'secretaria'
        CHECK (role IN ('superadmin', 'pastor_diretor', 'admin', 'financeiro', 'secretaria', 'kids_leader')),
    church_id TEXT REFERENCES public.churches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona coluna name se já existia a tabela sem ela
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS name TEXT;

-- ==============================================================================
-- 2. Função SECURITY DEFINER para leitura segura do papel (quebra a recursão RLS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_roles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ==============================================================================
-- 3. Habilitar RLS e definir policies SEM recursão
-- ==============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas que causavam recursão
DROP POLICY IF EXISTS "Usuários podem ver o próprio perfil e admins podem ver tudo" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem criar user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem atualizar user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem deletar user_roles" ON public.user_roles;

-- SELECT: cada usuário vê o próprio perfil; admins veem todos (via função sem recursão)
CREATE POLICY "select_user_roles"
ON public.user_roles FOR SELECT
USING (
    auth.uid() = id
    OR public.get_my_role() IN ('superadmin', 'admin', 'pastor_diretor')
);

-- INSERT: permitido (o trigger e o upsert do sistema precisam disso)
CREATE POLICY "insert_user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (true);

-- UPDATE: permitido para admins ou para o próprio usuário
CREATE POLICY "update_user_roles"
ON public.user_roles FOR UPDATE
USING (
    auth.uid() = id
    OR public.get_my_role() IN ('superadmin', 'admin', 'pastor_diretor')
);

-- DELETE: apenas admins
CREATE POLICY "delete_user_roles"
ON public.user_roles FOR DELETE
USING (
    public.get_my_role() IN ('superadmin', 'admin', 'pastor_diretor')
);

-- ==============================================================================
-- 4. Trigger para criar perfil automaticamente após signup no Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (id, email, name, role, church_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'secretaria'),
    NEW.raw_user_meta_data->>'church_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    name      = EXCLUDED.name,
    role      = EXCLUDED.role,
    church_id = EXCLUDED.church_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- COMO CRIAR O PRIMEIRO SUPERADMIN:
-- 1. Vá em Authentication -> Users no painel do Supabase e crie/convide o usuário.
-- 2. Abra a tabela public.user_roles no Table Editor.
-- 3. Encontre seu usuário e altere o campo "role" para 'superadmin'.
-- ==============================================================================
