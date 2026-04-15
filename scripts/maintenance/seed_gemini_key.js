const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GEMINI_KEY = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

async function run() {
  if (!GEMINI_KEY) {
    console.error('Erro: defina GEMINI_API_KEY ou GOOGLE_API_KEY no ambiente antes de rodar este script.');
    process.exit(1);
  }

  const { error } = await supa.from('settings').upsert({
    key_name: 'aiConfig',
    config_data: {
      geminiKey: GEMINI_KEY,
      provider: 'gemini' 
    }
  });
  console.log(error ? 'Erro: ' + error.message : 'Gemini salva no Supabase! Groq substituída.');
}
run();
