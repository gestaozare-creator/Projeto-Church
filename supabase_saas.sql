-- ==============================================================================
-- CHURCHFLOW SaaS: REDES, PLANOS E DEPARTAMENTOS
-- Execute este script no painel SQL do Supabase.
-- ==============================================================================

-- 1. ADICIONAR CAMPOS SaaS NA TABELA DE IGREJAS (TENANTS)
-- O campo ministry_id agrupa igrejas sob a mesma "Rede/Ministério"
ALTER TABLE public.churches 
ADD COLUMN IF NOT EXISTS ministry_id TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Pro', 'Premium')),
ADD COLUMN IF NOT EXISTS member_limit INTEGER, -- null = Ilimitado
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'Trial' CHECK (subscription_status IN ('Trial', 'Ativa', 'Inadimplente', 'Cancelada')),
ADD COLUMN IF NOT EXISTS departments TEXT[], -- Ex: '{Louvor, Mídia, Kids}'
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Adiciona campos de controle de culto e horário na tabela de membros/visitantes
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS culto TEXT,
ADD COLUMN IF NOT EXISTS horario TEXT;

-- 2. CRIAR TABELA: AGENDA DE CULTOS (SERVICES)
-- Substituirá a lógica local para que todos os dashboards puxem daqui
CREATE TABLE IF NOT EXISTS public.church_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: Culto da Família
    day_of_week TEXT NOT NULL, -- Ex: Domingo
    time TEXT NOT NULL, -- Ex: 18:30
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELAS DO MÓDULO KIDS
CREATE TABLE IF NOT EXISTS public.kids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE,
    parent_name TEXT,
    parent_phone TEXT,
    allergies TEXT,
    special_needs TEXT, -- Adicionado para segurança extra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se a kids_checkin existir usando member_id, vamos recriá-la apontando para a nova tabela 'kids'
DROP TABLE IF EXISTS public.kids_checkin CASCADE;
CREATE TABLE public.kids_checkin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE,
    responsible_id TEXT REFERENCES public.members(id) ON DELETE SET NULL, -- Membro que trouxe/buscou
    room TEXT, -- Berçário, Maternal...
    service_date DATE NOT NULL,
    service_time TEXT NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'presente',
    security_code TEXT NOT NULL
);

-- 4. CRIAR TABELA: ESCALAS DOS DEPARTAMENTOS (LOUVOR, MÍDIA, etc)
CREATE TABLE IF NOT EXISTS public.escalas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    department TEXT NOT NULL, -- Ex: Louvor, Mídia, Obreiros
    date DATE NOT NULL,
    role TEXT NOT NULL, -- Ex: Baterista, Câmera 1
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DADOS INICIAIS (SEED) DA AGENDA DE CULTOS DA SEDE E FILIAIS
INSERT INTO public.church_services (church_id, name, day_of_week, time) VALUES
('1', 'Culto da Família', 'Domingo', '18:00'),
('1', 'Escola Bíblica (EBD)', 'Domingo', '09:00'),
('1', 'Culto de Ensino', 'Quarta-feira', '19:30'),
('1', 'Culto dos Jovens', 'Sábado', '20:00'),
('2', 'Culto de Celebração', 'Domingo', '18:30'),
('2', 'Culto de Libertação', 'Sexta-feira', '19:30')
ON CONFLICT DO NOTHING;

-- 6. ATUALIZAR AS IGREJAS DE TESTE COM REDES E PLANOS SaaS
UPDATE public.churches SET ministry_id = 'min1', plan = 'Premium', subscription_status = 'Ativa', departments = '{Louvor, Mídia, Kids, Obreiros}' WHERE id = '1';
UPDATE public.churches SET ministry_id = 'min1', plan = 'Pro', member_limit = 500, subscription_status = 'Ativa', departments = '{Louvor, Kids}' WHERE id = '2';
UPDATE public.churches SET ministry_id = 'min2', plan = 'Basic', member_limit = 150, subscription_status = 'Inadimplente' WHERE id = '3';

-- 7. POLÍTICAS DE SEGURANÇA (RLS) PARA A AGENDA DE CULTOS
ALTER TABLE public.church_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de cultos para todos" ON public.church_services;
CREATE POLICY "Permitir leitura de cultos para todos"
ON public.church_services FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir escrita de cultos para todos" ON public.church_services;
CREATE POLICY "Permitir escrita de cultos para todos"
ON public.church_services FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de cultos para todos" ON public.church_services;
CREATE POLICY "Permitir atualização de cultos para todos"
ON public.church_services FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Permitir deleção de cultos para todos" ON public.church_services;
CREATE POLICY "Permitir deleção de cultos para todos"
ON public.church_services FOR DELETE
USING (true);
-- 8. POLÍTICAS DE SEGURANÇA (RLS) PARA A TABELA MEMBERS (ONLINE REGISTRATION)
-- Permite que o formulário público faça o INSERT mesmo sem estar logado
DROP POLICY IF EXISTS "Permitir inserção pública na tabela members" ON public.members;
CREATE POLICY "Permitir inserção pública na tabela members"
ON public.members FOR INSERT
WITH CHECK (true);
