-- Adicionar a coluna attachment_url à tabela transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS attachment_url text;

-- Inserir o bucket receipts no storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir acesso público de leitura
CREATE POLICY Permitir leitura pública para anexos 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts');

-- Criar política para permitir upload de anexos para usuários autenticados
CREATE POLICY Permitir upload para anexos 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts');

-- Criar política para permitir exclusão (opcional)
CREATE POLICY Permitir exclusão de anexos 
ON storage.objects FOR DELETE 
USING (bucket_id = 'receipts');
