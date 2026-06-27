-- ==============================================================================
-- CHURCHFLOW: AUTENTICAÇÃO E PERMISSÕES (SUPABASE)
-- Execute este script no painel SQL do Supabase.
-- ==============================================================================

-- 1. Criação da tabela de perfis de usuário (user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'pastor_diretor', 'admin', 'financeiro', 'secretaria', 'kids_leader')),
    church_id TEXT, -- NULL se for superadmin ou pastor_diretor com acesso global
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segurança de Linha (RLS) para user_roles (Leitura pública para o AuthContext, escrita restrita)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver o próprio perfil e admins podem ver tudo"
ON public.user_roles FOR SELECT
USING (auth.uid() = id OR (SELECT role FROM public.user_roles WHERE id = auth.uid()) IN ('superadmin', 'admin', 'pastor_diretor'));

-- 2. Trigger para criar perfil automaticamente após cadastro no Auth
-- Como o sistema é fechado (cadastro via painel pelo Admin), podemos usar metadados 
-- (raw_user_meta_data) para definir o cargo e a igreja inicial ao convidar o usuário, 
-- ou preencher com um padrão de 'visitante' (por segurança, vamos usar 'secretaria' genérico ou ler dos metadados).
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (id, email, role, church_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'secretaria'), -- Default seguro
    NEW.raw_user_meta_data->>'church_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar a trigger à tabela nativa auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- COMO CRIAR O PRIMEIRO SUPERADMIN:
-- Vá em Authentication -> Users no painel do Supabase.
-- Invite um usuário ou crie (Add User). 
-- Depois, abra a tabela public.user_roles no Table Editor, 
-- encontre o seu usuário lá e altere o campo "role" para 'superadmin'.
-- ==============================================================================
