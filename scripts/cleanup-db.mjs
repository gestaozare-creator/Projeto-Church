import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually since we don't want to install dotenv just for this
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log("Iniciando limpeza do banco de dados (Mantendo apenas users e churches)...");

const tablesToClean = [
    'transactions',
    'kids_checkin',
    'kids',
    'visitors',
    'scale_members',
    'scale_roles',
    'scales',
    'events',
    'cultos',
    'rooms',
    'patrimonio',
    'members'
  ];

  for (const table of tablesToClean) {
    console.log(`Limpando tabela: ${table}...`);
    // Passando delete() para todas as linhas (usando neq id 0 ou null, ou apenas deletar tudo onde id is not null)
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition that matches all UUIDs (or use an always true condition if IDs vary)
      
    if (error) {
      // Tentar deletar por outro campo se 'id' não existir, ou se UUID não for a chave
      console.log(`Erro ao deletar ${table} com 'id' UUID, tentando outra condição...`);
      const { error: err2 } = await supabase.from(table).delete().gte('created_at', '2000-01-01');
      if (err2) {
        console.error(`Falha ao limpar ${table}:`, err2.message);
      } else {
        console.log(`Tabela ${table} limpa com sucesso!`);
      }
    } else {
      console.log(`Tabela ${table} limpa com sucesso!`);
    }
  }

  console.log("Limpeza concluída com sucesso! Banco pronto para produção.");
}

cleanup();
