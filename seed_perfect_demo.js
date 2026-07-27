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

async function runPerfectDemoSeed() {
  const demoMinistryId = 'a1b2c3d4-demo-4444-8888-999999999999';
  const demoChurchId = 'demo_church_001';

  // 1. Geocache de Curitiba com Coordenadas Reais para todos os endereços da demo
  const geocacheData = {
    'Rua XV de Novembro, 500, Centro, Curitiba - PR': { lat: -25.4297, lng: -49.2711 },
    'Rua XV de Novembro, 100, Centro, Curitiba - PR': { lat: -25.4284, lng: -49.2733 },
    'Av. Batel, 1500, Batel, Curitiba - PR': { lat: -25.4435, lng: -49.2890 },
    'Rua das Flores, 45, Agua Verde, Curitiba - PR': { lat: -25.4490, lng: -49.2780 },
    'Rua Marechal Deodoro, 300, Centro, Curitiba - PR': { lat: -25.4310, lng: -49.2680 },
    'Av. Cândido de Abreu, 200, Centro, Curitiba - PR': { lat: -25.4220, lng: -49.2690 },
    'Rua Comendador Araújo, 500, Batel, Curitiba - PR': { lat: -25.4380, lng: -49.2810 },
    'Rua Visconde de Nácar, 800, Centro, Curitiba - PR': { lat: -25.4350, lng: -49.2760 },
    'Av. Sete de Setembro, 3000, Rebouças, Curitiba - PR': { lat: -25.4400, lng: -49.2670 },
    'Rua Brigadeiro Franco, 1200, Agua Verde, Curitiba - PR': { lat: -25.4450, lng: -49.2800 },
    'Rua Itupava, 400, Alto da XV, Curitiba - PR': { lat: -25.4260, lng: -49.2550 },
    'Rua Almirante Tamandaré, 250, Alto da XV, Curitiba - PR': { lat: -25.4250, lng: -49.2520 },
    'Rua Silveira Peixoto, 600, Batel, Curitiba - PR': { lat: -25.4460, lng: -49.2850 },
    'Rua Desembargador Motta, 1000, Batel, Curitiba - PR': { lat: -25.4390, lng: -49.2840 },
    'Rua Bento Viana, 300, Agua Verde, Curitiba - PR': { lat: -25.4440, lng: -49.2830 }
  };

  const demoConfig = {
    geocache: geocacheData,
    cardConfig: { primaryColor: '#0f172a' }
  };

  // 2. Salvar Igreja Demo com Geocache e Logo
  const { data: church, error: cErr } = await supabase
    .from('churches')
    .upsert({
      id: demoChurchId,
      name: 'Igreja Central Modelo (Demo)',
      is_headquarters: true,
      city: 'Curitiba',
      state: 'PR',
      neighborhood: 'Centro',
      address: 'Rua XV de Novembro, 500, Centro, Curitiba - PR',
      phone: '(41) 99888-7777',
      pastor_name: 'Pr. Marcos Silva',
      logo_url: 'https://images.unsplash.com/photo-1548625361-186f9166f0ef?w=150&auto=format&fit=crop&q=80',
      cover_photo_url: 'https://images.unsplash.com/photo-1548625361-186f9166f0ef?w=150&auto=format&fit=crop&q=80',
      plan: 'Pro',
      ministry_id: 'min_demo_standalone',
      config: demoConfig
    })
    .select()
    .single();

  if (cErr) console.error('Erro igreja demo:', cErr);
  else console.log('✅ Igreja Central Modelo (Demo) atualizada com Geocache e Logo!');

  // 3. Fotos de Avatar em HD (Unsplash Nativas de Pessoas Reais)
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80', // Masculino
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80', // Feminina
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'  // Masculino
  ];

  // Datas de aniversário: Hoje (27 de Julho), Julho, etc.
  const todayBirth = '1992-07-27'; // Aniversariante do Dia
  const monthBirth1 = '1988-07-05'; 
  const monthBirth2 = '1995-07-18'; 
  const monthBirth3 = '1985-07-30'; 

  const mockMembers = [
    { id: 'demo_m_1', name: 'Carlos Eduardo Oliveira', phone: '41991112222', function: 'Presbítero', status: 'ativo', birth_date: todayBirth, address: 'Rua XV de Novembro, 100, Centro, Curitiba - PR', photo_url: avatars[1] },
    { id: 'demo_m_2', name: 'Mariana Souza Santos', phone: '41992223333', function: 'Diácono(a)', status: 'ativo', birth_date: monthBirth1, address: 'Av. Batel, 1500, Batel, Curitiba - PR', photo_url: avatars[0] },
    { id: 'demo_m_3', name: 'Fernanda Lima', phone: '41993334444', function: 'Obreiro(a)', status: 'ativo', birth_date: monthBirth2, address: 'Rua das Flores, 45, Agua Verde, Curitiba - PR', photo_url: avatars[2] },
    { id: 'demo_m_4', name: 'Roberto Alves', phone: '41994445555', function: 'Membro', status: 'ativo', birth_date: monthBirth3, address: 'Rua Marechal Deodoro, 300, Centro, Curitiba - PR', photo_url: avatars[3] },
    { id: 'demo_m_5', name: 'Juliana Costa', phone: '41995556666', function: 'Membro', status: 'ativo', birth_date: '1990-03-12', address: 'Av. Cândido de Abreu, 200, Centro, Curitiba - PR', photo_url: avatars[4] },
    { id: 'demo_m_6', name: 'Lucas Mendes', phone: '41996667777', function: 'Líder', status: 'ativo', birth_date: '1987-11-25', address: 'Rua Comendador Araújo, 500, Batel, Curitiba - PR', photo_url: avatars[5] },
    { id: 'demo_m_7', name: 'Beatriz Rocha', phone: '41997778888', function: 'Diácono(a)', status: 'ativo', birth_date: '1994-09-08', address: 'Rua Visconde de Nácar, 800, Centro, Curitiba - PR', photo_url: avatars[6] },
    { id: 'demo_m_8', name: 'Gabriel Martins', phone: '41998889999', function: 'Obreiro(a)', status: 'ativo', birth_date: '1991-01-20', address: 'Av. Sete de Setembro, 3000, Rebouças, Curitiba - PR', photo_url: avatars[7] },
    { id: 'demo_m_9', name: 'Camila Ribeiro', phone: '41999990000', function: 'Membro', status: 'ativo', birth_date: '1996-05-14', address: 'Rua Brigadeiro Franco, 1200, Agua Verde, Curitiba - PR', photo_url: avatars[8] },
    { id: 'demo_m_10', name: 'Rodrigo Barbosa', phone: '41991234567', function: 'Presbítero', status: 'ativo', birth_date: '1982-12-01', address: 'Rua Itupava, 400, Alto da XV, Curitiba - PR', photo_url: avatars[9] },
    
    // Visitantes Fictícios
    { id: 'demo_m_11', name: 'Marcelo Pires (Visitante)', phone: '41988881111', function: 'Visitante', status: 'visitante', birth_date: '1998-04-04', address: 'Rua Almirante Tamandaré, 250, Alto da XV, Curitiba - PR', photo_url: avatars[11] },
    { id: 'demo_m_12', name: 'Vanessa Toledo (Visitante)', phone: '41988882222', function: 'Visitante', status: 'visitante', birth_date: '2001-08-19', address: 'Rua Silveira Peixoto, 600, Batel, Curitiba - PR', photo_url: avatars[10] },
    { id: 'demo_m_13', name: 'Thiago Farias (Em Conversão)', phone: '41988883333', function: 'Visitante', status: 'em_conversao', birth_date: '1993-02-28', address: 'Rua Desembargador Motta, 1000, Batel, Curitiba - PR', photo_url: avatars[13] },
    { id: 'demo_m_14', name: 'Patrícia Duarte (Em Conversão)', phone: '41988884444', function: 'Visitante', status: 'em_conversao', birth_date: '1989-10-10', address: 'Rua Bento Viana, 300, Agua Verde, Curitiba - PR', photo_url: avatars[12] }
  ];

  const memberRows = mockMembers.map(m => ({
    id: m.id,
    church_id: demoChurchId,
    name: m.name,
    phone: m.phone,
    function: m.function,
    status: m.status,
    state: 'PR',
    address: m.address,
    birth_date: m.birth_date,
    photo_url: m.photo_url,
    integration_date: '2025-01-15'
  }));

  const { error: mErr } = await supabase.from('members').upsert(memberRows);
  if (mErr) console.error('Erro membros demo:', mErr);
  else console.log(`✅ ${memberRows.length} Membros e Visitantes atualizados com fotos em HD, datas e geocache!`);

  console.log('--- SEED PERFECT DEMO CONCLUÍDO ---');
}

runPerfectDemoSeed();
