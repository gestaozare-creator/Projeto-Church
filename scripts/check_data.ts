import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]/g, '').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { count: eventsCount, error: err1 } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const { count: guestsCount, error: err2 } = await supabase.from('event_guests').select('*', { count: 'exact', head: true });
  const { count: kidsCount, error: err3 } = await supabase.from('kids_rooms').select('*', { count: 'exact', head: true });

  console.log('Events Count:', eventsCount);
  console.log('Guests Count:', guestsCount);
  console.log('Kids Rooms Count:', kidsCount);

  if (guestsCount && guestsCount > 0) {
    const { data: guests } = await supabase.from('event_guests').select('*').limit(5);
    console.log('Sample Guests:', guests);
  }
}

main();
