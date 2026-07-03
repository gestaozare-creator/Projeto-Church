const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envStr.split('\n').forEach(line => {
    if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(url, key);

async function run() {
    const CHURCH_ID = '1782771173659';

    console.log('=== TESTE: Lendo config atual ===');
    const { data: before } = await supabaseAdmin
        .from('churches').select('config').eq('id', CHURCH_ID).single();
    
    // Parse como o código vai fazer
    let currentConfig = {};
    if (before?.config) {
        if (typeof before.config === 'string') {
            try { currentConfig = JSON.parse(before.config); } catch { currentConfig = {}; }
        } else {
            currentConfig = before.config;
        }
    }
    console.log('Config parseado:', JSON.stringify(currentConfig, null, 2));

    console.log('\n=== Salvando escala de teste ===');
    if (!currentConfig.escalas) currentConfig.escalas = {};
    currentConfig.escalas['Louvor'] = {
        '2026-07-20': { 'Ministro': ['m_1782790195691'] }
    };

    const { error } = await supabaseAdmin
        .from('churches').update({ config: currentConfig }).eq('id', CHURCH_ID);
    
    if (error) { console.log('❌ ERRO:', error); return; }
    console.log('✅ Salvo!');

    console.log('\n=== Verificando se ficou salvo ===');
    const { data: after } = await supabaseAdmin
        .from('churches').select('config').eq('id', CHURCH_ID).single();
    
    let afterConfig = {};
    if (after?.config) {
        if (typeof after.config === 'string') {
            try { afterConfig = JSON.parse(after.config); } catch {}
        } else { afterConfig = after.config; }
    }
    
    const louvor = afterConfig?.escalas?.Louvor;
    if (louvor) {
        console.log('✅ FUNCIONOU! Escala salva:', JSON.stringify(louvor));
    } else {
        console.log('❌ FALHOU! Escalas não encontradas no banco.');
        console.log('Config depois:', JSON.stringify(afterConfig));
    }
}

run().catch(console.error);
