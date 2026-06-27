-- ==============================================================================
-- CHURCHFLOW: ESTRUTURA DE BANCO DE DADOS (SUPABASE)
-- Opção B: Refatoração completa (Remoção dos dados de teste estáticos)
-- ==============================================================================

-- 1. Tabela de Visitantes
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
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

-- 2. Tabela de Fornecedores (Contas a Pagar)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Transações Financeiras (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pendente',
    payment_method TEXT,
    due_date DATE,
    paid_date DATE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- Receitas
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL, -- Despesas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Ativos/Patrimônio
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value NUMERIC(10, 2),
    acquire_date DATE,
    location TEXT,
    status TEXT DEFAULT 'ativo',
    expense_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabelas de Eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'agendado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Metas (Ranking)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('almas', 'membros', 'arrecadacao')),
    target NUMERIC NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Check-in Kids
CREATE TABLE IF NOT EXISTS public.kids_checkin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id TEXT NOT NULL,
    child_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    responsible_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    service_date DATE NOT NULL,
    service_time TEXT NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'checked_in',
    security_code TEXT NOT NULL
);

-- Habilitar RLS (Row Level Security) opcionalmente para as novas tabelas
-- (Atualmente o sistema filtra no frontend pelo church_id, mas é boa prática ativar no banco futuramente)
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_checkin ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público Temporário (Alinhar com sua política de Auth atual)
-- OBS: Substitua "true" pela verificação de usuário logado se a segurança estrita já estiver ativa.
CREATE POLICY "Permitir acesso total temporário Visitors" ON public.visitors FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Events" ON public.events FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Goals" ON public.goals FOR ALL USING (true);
CREATE POLICY "Permitir acesso total temporário Kids" ON public.kids_checkin FOR ALL USING (true);
