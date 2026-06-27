-- ==============================================================================
-- CHURCHFLOW: ESTRUTURA COMPLEMENTAR E CARGA INICIAL (SEED)
-- Este script cria as tabelas de igrejas e membros, e insere os dados iniciais.
-- ==============================================================================

-- 1. Tabelas Iniciais Faltantes
CREATE TABLE IF NOT EXISTS public.churches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_headquarters BOOLEAN DEFAULT FALSE,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Como transactions.member_id foi criado como UUID, vamos alterar para TEXT 
-- para facilitar a migração dos dados de teste (m1, m2, etc).
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_member_id_fkey;
ALTER TABLE public.transactions ALTER COLUMN member_id TYPE TEXT;
ALTER TABLE public.kids_checkin DROP CONSTRAINT IF EXISTS kids_checkin_child_id_fkey;
ALTER TABLE public.kids_checkin DROP CONSTRAINT IF EXISTS kids_checkin_responsible_id_fkey;
ALTER TABLE public.kids_checkin ALTER COLUMN child_id TYPE TEXT;
ALTER TABLE public.kids_checkin ALTER COLUMN responsible_id TYPE TEXT;

CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    state TEXT,
    function TEXT,
    ministry TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona as FKs novamente referenciando os novos campos TEXT
ALTER TABLE public.transactions ADD CONSTRAINT transactions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.kids_checkin ADD CONSTRAINT kids_checkin_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE public.kids_checkin ADD CONSTRAINT kids_checkin_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.members(id) ON DELETE SET NULL;


-- 2. Carga Inicial de Igrejas
INSERT INTO public.churches (id, name, is_headquarters, city, state) VALUES
('1', 'Sede - Centro', true, 'São Paulo', 'SP'),
('2', 'Filial - Zona Sul', false, 'São Paulo', 'SP'),
('3', 'Filial - Campinas', false, 'Campinas', 'SP'),
('4', 'Filial - Guarulhos', false, 'Guarulhos', 'SP'),
('5', 'Filial - Osasco', false, 'Osasco', 'SP'),
('6', 'Filial - Santo André', false, 'Santo André', 'SP'),
('7', 'Filial - São Bernardo', false, 'São Bernardo do Campo', 'SP'),
('8', 'Filial - Sorocaba', false, 'Sorocaba', 'SP'),
('igreja_sede_01', 'Sede Original (Sistema)', true, 'São Paulo', 'SP'),
('filial_sp_02', 'Filial SP Original (Sistema)', false, 'São Paulo', 'SP')
ON CONFLICT (id) DO NOTHING;

-- 3. Carga Inicial de Membros
INSERT INTO public.members (id, church_id, name, phone, email, function, ministry, status) VALUES
('m1', '1', 'André Silva', '(11) 99999-9999', 'andre@email.com', 'Líder de Louvor', 'Louvor', 'ativo'),
('m2', '1', 'Juliana Costa', '(11) 98888-8888', 'juliana@email.com', 'Baterista', 'Louvor', 'ativo'),
('m3', '2', 'Carlos Santos', '(11) 97777-7777', 'carlos@email.com', 'Obreiro', 'Obreiros', 'ativo'),
('m4', '1', 'Patricia Lins', '(11) 94444-4444', 'patricia@email.com', 'Tecladista', 'Louvor', 'ativo'),
('m14', '3', 'Thiago Mendes', '(41) 93333-4444', 'thiago@email.com', 'Líder', 'Pastoral', 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 4. Carga Inicial de Fornecedores
INSERT INTO public.suppliers (id, name, document, phone) VALUES
('s1', 'Imobiliária Central', '12.345.678/0001-90', '(11) 3333-4444'),
('s2', 'CPFL Energia', '02.558.157/0001-62', '0800-010-0102'),
('s3', 'Sabesp', '43.776.517/0001-80', '0800-011-9911'),
('s4', 'TechFrio Climatização', '44.555.666/0001-77', '(11) 5555-6666'),
('s5', 'Papelaria Modelo', '33.222.111/0001-55', '(11) 2222-3333')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS opcionalmente para as novas tabelas
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total temporário Churches" ON public.churches FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Members" ON public.members FOR ALL USING (true);
