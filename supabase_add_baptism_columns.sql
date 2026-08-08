-- =======================================================
-- MIGRATION: Adicionar colunas de Batismo na tabela members
-- Copie e cole este comando no Supabase > SQL Editor e clique em RUN
-- =======================================================

ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS is_baptized TEXT,
  ADD COLUMN IF NOT EXISTS baptism_date DATE;

-- Forçar atualização do cache do esquema PostgREST no Supabase
NOTIFY pgrst, 'reload schema';
