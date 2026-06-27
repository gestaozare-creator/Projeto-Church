-- ==============================================================================
-- CHURCHFLOW: CORREÇÃO E RECRIAÇÃO LIMPA DAS TABELAS
-- (Rode este script para limpar qualquer conflito e criar a estrutura correta)
-- ==============================================================================

-- 1. Remover tabelas antigas (cuidado: apaga dados de teste, mas como estamos no início, está tudo bem)
DROP TABLE IF EXISTS public.kids_checkin CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.churches CASCADE;

-- 2. Criar tabelas base (Igrejas e Membros) com IDs do tipo TEXT
CREATE TABLE public.churches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_headquarters BOOLEAN DEFAULT FALSE,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.members (
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

-- 3. Criar Visitantes
CREATE TABLE public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    region TEXT,
    how_knew_church TEXT,
    wants_visit BOOLEAN DEFAULT FALSE,
    address TEXT,
    status TEXT DEFAULT 'visitante',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar Fornecedores
CREATE TABLE public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar Transações (Financeiro)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pendente',
    payment_method TEXT,
    due_date DATE,
    paid_date DATE,
    member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL, -- ID do tipo TEXT
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL, -- ID do tipo TEXT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar Patrimônio
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC(10, 2),
    acquire_date DATE,
    location TEXT,
    status TEXT DEFAULT 'ativo',
    expense_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar Eventos
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT, -- Pode ser 'GLOBAL' ou o ID da igreja
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'agendado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Criar Metas
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('almas', 'membros', 'arrecadacao')),
    target NUMERIC NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Criar Check-in Kids
CREATE TABLE public.kids_checkin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT REFERENCES public.churches(id) ON DELETE CASCADE,
    child_id TEXT REFERENCES public.members(id) ON DELETE CASCADE, -- ID do tipo TEXT
    responsible_id TEXT REFERENCES public.members(id) ON DELETE SET NULL, -- ID do tipo TEXT
    service_date DATE NOT NULL,
    service_time TEXT NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'checked_in',
    security_code TEXT NOT NULL
);

-- 10. INSERIR OS DADOS INICIAIS (SEED)
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

INSERT INTO public.members (id, church_id, name, phone, email, function, ministry, status) VALUES
('m1', '1', 'André Silva', '(11) 99999-9999', 'andre@email.com', 'Líder de Louvor', 'Louvor', 'ativo'),
('m2', '1', 'Juliana Costa', '(11) 98888-8888', 'juliana@email.com', 'Baterista', 'Louvor', 'ativo'),
('m3', '2', 'Carlos Santos', '(11) 97777-7777', 'carlos@email.com', 'Obreiro', 'Obreiros', 'ativo'),
('m4', '1', 'Patricia Lins', '(11) 94444-4444', 'patricia@email.com', 'Tecladista', 'Louvor', 'ativo'),
('m14', '3', 'Thiago Mendes', '(41) 93333-4444', 'thiago@email.com', 'Líder', 'Pastoral', 'ativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, name, document, phone) VALUES
('s1', 'Imobiliária Central', '12.345.678/0001-90', '(11) 3333-4444'),
('s2', 'CPFL Energia', '02.558.157/0001-62', '0800-010-0102'),
('s3', 'Sabesp', '43.776.517/0001-80', '0800-011-9911'),
('s4', 'TechFrio Climatização', '44.555.666/0001-77', '(11) 5555-6666'),
('s5', 'Papelaria Modelo', '33.222.111/0001-55', '(11) 2222-3333')
ON CONFLICT (id) DO NOTHING;

-- Habilitar Políticas
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total temporário" ON public.churches FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário" ON public.members FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário" ON public.visitors FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário" ON public.transactions FOR ALL USING (true);
