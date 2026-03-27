const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supa.from('settings').upsert({
        key_name: 'aiConfig',
        config_data: { groqKey: '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', provider: 'groq' }
    });
    console.log(error ? 'Erro: ' + error.message : 'Chave salva no Supabase com sucesso!');
}
run();
