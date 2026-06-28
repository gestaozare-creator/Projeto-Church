const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Ler o .env.local manualmente, pois dotenv estava dando erro no ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltam credenciais do Supabase no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Verificando tabelas para limpeza...');
    
    // Verifica event_guests
    const { data: eventGuests, error: errGuests } = await supabase.from('event_guests').select('*');
    if (errGuests) {
        console.error('Erro ao buscar event_guests:', errGuests.message);
    } else {
        console.log(`Encontrados ${eventGuests.length} registros em event_guests.`);
        if (eventGuests.length > 0) {
            console.log('Amostra de event_guests:', eventGuests.slice(0, 2));
        }
    }

    // Verifica kids_rooms (citado pelo user antes)
    const { data: kidsRooms, error: errRooms } = await supabase.from('kids_rooms').select('*');
    if (errRooms) {
        console.error('Erro ao buscar kids_rooms:', errRooms.message);
    } else {
        console.log(`Encontrados ${kidsRooms.length} registros em kids_rooms.`);
        if (kidsRooms.length > 0) {
            console.log('Amostra de kids_rooms:', kidsRooms.slice(0, 2));
        }
    }
    
    // Verifica kids_checkin
    const { data: kidsCheckin, error: errCheckin } = await supabase.from('kids_checkin').select('*');
    if (errCheckin) {
        console.error('Erro ao buscar kids_checkin:', errCheckin.message);
    } else {
        console.log(`Encontrados ${kidsCheckin.length} registros em kids_checkin.`);
    }

    // Verifica transactions
    const { data: transactions, error: errTrans } = await supabase.from('transactions').select('*');
    if (errTrans) {
        console.error('Erro ao buscar transactions:', errTrans.message);
    } else {
        console.log(`Encontrados ${transactions.length} registros em transactions.`);
    }
    
    // Verifica assets
    const { data: assets, error: errAssets } = await supabase.from('assets').select('*');
    if (errAssets) {
        console.error('Erro ao buscar assets:', errAssets.message);
    } else {
        console.log(`Encontrados ${assets.length} registros em assets.`);
    }
    
    // Verifica events
    const { data: events, error: errEvents } = await supabase.from('events').select('*');
    if (errEvents) {
        console.error('Erro ao buscar events:', errEvents.message);
    } else {
        console.log(`Encontrados ${events.length} registros em events.`);
    }
}

checkTables();
