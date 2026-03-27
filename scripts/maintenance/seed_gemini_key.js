const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'COLE_SUA_CHAVE_AQUI';

async function run() {
  const { data, error } = await supa.from('settings').upsert({
    key_name: 'aiConfig',
    config_data: {       geminiKey: GEMINI_KEY, 
      provider: 'gemini' 
    }
  });
  console.log(error ? 'Erro: ' + error.message : 'Gemini salva no Supabase! Groq substituída.');
}
run();
