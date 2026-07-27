const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error('Env vars not found');
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function cleanDemoData() {
  const demoChurchId = 'demo_church_001';

  console.log('--- LIMPANDO TODOS OS DADOS DA IGREJA DEMO ---');

  // 1. Apagar transações da igreja demo
  const { error: tErr } = await supabase
    .from('transactions')
    .delete()
    .eq('church_id', demoChurchId);

  if (tErr) console.error('Erro ao deletar transações demo:', tErr);
  else console.log('✅ Transações fictícias da igreja demo deletadas com sucesso!');

  // 2. Apagar membros e visitantes da igreja demo
  const { error: mErr } = await supabase
    .from('members')
    .delete()
    .eq('church_id', demoChurchId);

  if (mErr) console.error('Erro ao deletar membros demo:', mErr);
  else console.log('✅ Membros e visitantes fictícios deletados com sucesso!');

  // Também deletar membros que iniciem com demo_m_
  const { error: mErr2 } = await supabase
    .from('members')
    .delete()
    .like('id', 'demo_m_%');

  if (mErr2) console.error('Erro ao deletar membros por ID demo:', mErr2);

  // 3. Apagar a igreja demo
  const { error: cErr } = await supabase
    .from('churches')
    .delete()
    .eq('id', demoChurchId);

  if (cErr) console.error('Erro ao deletar igreja demo:', cErr);
  else console.log('✅ Registro da igreja demo deletado de churches!');

  // 4. Apagar ministério demo se existir
  const { error: minErr } = await supabase
    .from('ministries')
    .delete()
    .eq('id', 'min_demo_standalone');

  if (minErr) console.error('Erro ao deletar ministério demo:', minErr);

  console.log('--- PURGA DO BANCO CONCLUÍDA COM SUCESSO ---');
}

cleanDemoData();
