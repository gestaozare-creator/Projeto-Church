import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing Ministry insertion...");
  const { data: minData, error: minError } = await supabase.from('ministries').insert([
    { name: 'Test Ministry ' + Date.now(), director_pastor_name: 'Test Pastor' }
  ]).select();
  
  if (minError) console.error("Ministry Error:", minError);
  else {
    console.log("Ministry OK:", minData);
    
    console.log("Testing Church insertion...");
    const { data: chData, error: chError } = await supabase.from('churches').insert([
      {
        id: Date.now().toString(),
        name: 'Test Church',
        ministry_id: minData[0].id
      }
    ]).select();
    
    if (chError) console.error("Church Error:", chError);
    else console.log("Church OK:", chData);
  }
}

test();
