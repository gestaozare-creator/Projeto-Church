const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yuhrisaktbfnuzjklqqu.supabase.co',
  'sb_publishable_VsM7Mb-zJ6vPfpFduN4ytQ__fZZ2qhD'
);

async function inspect() {
  let allMembers = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: pageData, error } = await supabase
      .from('members')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!pageData || pageData.length === 0) break;
    allMembers = [...allMembers, ...pageData];
    if (pageData.length < pageSize) break;
    page++;
  }

  const dbVisitors = allMembers.filter(x => x.function === 'Visitante' || x.function === 'Visitante (Kids)' || x.function === 'Ainda não definida');
  
  console.log('\n--- EM CONVERSAO function details ---');
  dbVisitors.filter(v => v.status === 'em_conversao').forEach(c => {
    console.log(`Name: ${c.name}, ID: ${c.id}, function: ${c.function}, integrationDate: ${c.integration_date || c.created_at}`);
  });
  
  const others = allMembers.filter(v => v.status === 'em_conversao' && v.function !== 'Visitante' && v.function !== 'Visitante (Kids)' && v.function !== 'Ainda não definida');
  if (others.length > 0) {
     console.log('\n--- EM CONVERSAO but NOT in dbVisitors ---');
     others.forEach(c => {
       console.log(`Name: ${c.name}, ID: ${c.id}, function: ${c.function}, integrationDate: ${c.integration_date || c.created_at}`);
     });
  }
}

inspect();
