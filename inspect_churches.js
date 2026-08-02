const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yuhrisaktbfnuzjklqqu.supabase.co',
  'sb_publishable_VsM7Mb-zJ6vPfpFduN4ytQ__fZZ2qhD'
);

async function inspect() {
  const { data: churches, error } = await supabase
    .from('churches')
    .select('*');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  churches.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.name}, Ministry: ${c.ministry_id}, HQ: ${c.hq_id}, IsHQ: ${c.is_hq}`);
  });
}

inspect();
