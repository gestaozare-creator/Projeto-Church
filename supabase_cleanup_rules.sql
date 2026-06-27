-- =========================================================================
-- SCRIPT DE CONFIGURAÇÃO DE ROTAÇÃO E LIMPEZA AUTOMÁTICA DE DADOS (SUPABASE)
-- =========================================================================
-- Este script configura o banco de dados do Supabase para limpar dados
-- temporários de escalas e check-ins automaticamente para economizar armazenamento.
--
-- Para aplicar: copie este código, cole no SQL Editor do seu painel do Supabase e clique em RUN.

-- Habilita a extensão pg_cron (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- -------------------------------------------------------------------------
-- 1. LIMPEZA AUTOMÁTICA DO MINISTÉRIO INFANTIL (KIDS) - LIMITE DE 24 HORAS
-- -------------------------------------------------------------------------
-- Deleta registros de check-in infantil na tabela 'kids_checkins' 
-- que foram criados há mais de 24 horas.
-- Roda de forma automática todos os dias às 03:00 da manhã (UTC).
SELECT cron.schedule(
  'kids-checkin-cleanup-24h', -- Nome único da tarefa
  '0 3 * * *',                -- Sintaxe Cron (Todos os dias às 03:00)
  $$ 
    DELETE FROM kids_checkins 
    WHERE created_at < NOW() - INTERVAL '24 hours';
  $$
);

-- -------------------------------------------------------------------------
-- 2. LIMPEZA AUTOMÁTICA DE ESCALAS (LOUVOR, MÍDIA, OBREIROS) - LIMITE DE 40 DIAS
-- -------------------------------------------------------------------------
-- Deleta registros de escalas antigas nas tabelas de escalas 
-- que possuem mais de 40 dias de criação.
-- Roda de forma automática todos os domingos às 04:00 da manhã (UTC).

-- Tarefa para tabela 'escalas' (caso exista ou venha a ser criada com este nome)
SELECT cron.schedule(
  'escalas-cleanup-40days',  -- Nome único da tarefa
  '0 4 * * 0',                -- Sintaxe Cron (Todo domingo às 04:00)
  $$ 
    DELETE FROM escalas 
    WHERE created_at < NOW() - INTERVAL '40 days';
  $$
);

-- Tarefa para tabela 'schedules' (nome alternativo comum em inglês)
SELECT cron.schedule(
  'schedules-cleanup-40days', -- Nome único da tarefa
  '10 4 * * 0',                -- Sintaxe Cron (Todo domingo às 04:10)
  $$ 
    DELETE FROM schedules 
    WHERE created_at < NOW() - INTERVAL '40 days';
  $$
);

-- -------------------------------------------------------------------------
-- COMO VERIFICAR AS TAREFAS AGENDADAS ATIVAS
-- -------------------------------------------------------------------------
-- Para listar todas as limpezas automáticas configuradas, execute:
-- SELECT * FROM cron.job;
--
-- Para ver o histórico de execuções (se rodaram com sucesso ou erro):
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- Para remover uma limpeza programada, execute:
-- SELECT cron.unschedule('kids-checkin-cleanup-24h');
