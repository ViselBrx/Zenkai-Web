const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GROQ_KEY = String(process.env.GROQ_API_KEY || '').trim();

async function run() {
    if (!GROQ_KEY) {
        console.error('Erro: defina GROQ_API_KEY no ambiente antes de rodar este script.');
        process.exit(1);
    }

    const { error } = await supa.from('settings').upsert({
        key_name: 'aiConfig',
        config_data: { groqKey: GROQ_KEY, provider: 'groq' }
    });
    console.log(error ? 'Erro: ' + error.message : 'Chave salva no Supabase com sucesso!');
}
run();
