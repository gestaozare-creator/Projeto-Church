-- ===========================================
-- MIGRATION: Adicionar colunas para carteirinha
-- Rode este SQL no Supabase > SQL Editor
-- ===========================================

-- 1. Adicionar card_config, active_modules e config na tabela churches
ALTER TABLE public.churches 
  ADD COLUMN IF NOT EXISTS active_modules TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS card_config TEXT,
  ADD COLUMN IF NOT EXISTS config TEXT;

-- 2. Adicionar campos de cadastro do membro (incluindo batismo)
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS integration_date DATE,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS card_validity TEXT,
  ADD COLUMN IF NOT EXISTS is_baptized TEXT,
  ADD COLUMN IF NOT EXISTS baptism_date DATE;

-- 3. Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('churches', 'members')
  AND column_name IN ('card_config', 'active_modules', 'integration_date', 'photo_url', 'card_validity', 'config')
ORDER BY table_name, column_name;

-- 4. Adicionar coluna 'name' na tabela user_roles (se ainda não existir)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS name TEXT;

-- 5. Garantir que a policy de INSERT existe para user_roles
-- (Permite que o trigger e upsert do sistema funcionem)
DROP POLICY IF EXISTS "Admins podem criar user_roles" ON public.user_roles;
CREATE POLICY "Admins podem criar user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar user_roles" ON public.user_roles;
CREATE POLICY "Admins podem atualizar user_roles"
ON public.user_roles FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Admins podem deletar user_roles" ON public.user_roles;
CREATE POLICY "Admins podem deletar user_roles"
ON public.user_roles FOR DELETE
USING (true);
