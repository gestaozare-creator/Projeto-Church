const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '', supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: churches } = await supabase.from('churches').select('id, name');
  console.log("Churches:", churches);

  // Instead of querying all tables, let's query the specific ones we saw in the frontend
  // Let's read app/rede/page.tsx content around "supabase.from"
  const fileContent = fs.readFileSync('app/rede/page.tsx', 'utf8');
  const lines = fileContent.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('supabase.from')) {
      console.log(`Line ${i}: ${l.trim()}`);
    }
  });

  // Let's also check DataProvider
  if (fs.existsSync('contexts/DataContext.tsx')) {
    const fileContent2 = fs.readFileSync('contexts/DataContext.tsx', 'utf8');
    const lines2 = fileContent2.split('\n');
    lines2.forEach((l, i) => {
      if (l.includes('supabase.from')) {
        console.log(`DataContext Line ${i}: ${l.trim()}`);
      }
    });
  }
}

run().catch(console.error);
