const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envStr.split('\n').forEach(line => {
    if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(url, key);

async function run() {
    const CHURCH_ID = '1782771173659';

    console.log('=== TESTE 1: Lendo config atual ===');
    const { data: before, error: err1 } = await supabaseAdmin
        .from('churches')
        .select('id, name, config')
        .eq('id', CHURCH_ID)
        .single();
    console.log('Config ANTES:', JSON.stringify(before?.config, null, 2));

    console.log('\n=== TESTE 2: Salvando escala de teste ===');
    const testEscala = {
        '2026-07-15': { 'Ministro': ['m_1782790195691'], 'Vocal': [] },
        '2026-07-20': { 'Ministro': [], 'Vocal': ['m_1782790827266'] }
    };
    const currentConfig = before?.config || {};
    if (!currentConfig.escalas) currentConfig.escalas = {};
    currentConfig.escalas['Louvor'] = testEscala;

    const { error: err2 } = await supabaseAdmin
        .from('churches')
        .update({ config: currentConfig })
        .eq('id', CHURCH_ID);
    
    if (err2) {
        console.log('ERRO ao salvar:', err2);
    } else {
        console.log('Salvo com sucesso!');
    }

    console.log('\n=== TESTE 3: Verificando se ficou salvo ===');
    const { data: after, error: err3 } = await supabaseAdmin
        .from('churches')
        .select('config')
        .eq('id', CHURCH_ID)
        .single();
    
    const savedEscala = after?.config?.escalas?.Louvor;
    console.log('Escalas salvas:', JSON.stringify(savedEscala, null, 2));

    if (savedEscala) {
        console.log('\n✅ BANCO DE DADOS SALVANDO CORRETAMENTE!');
    } else {
        console.log('\n❌ PROBLEMA NO BANCO: não conseguiu salvar!');
    }
}

run().catch(console.error);
