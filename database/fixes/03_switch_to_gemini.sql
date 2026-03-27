-- Switch from Groq to Gemini 1.5 Flash
-- Execute no Supabase SQL Editor

-- Assume table 'settings' exists (from seed_ai_key_setting.js)
UPDATE public.settings 
SET config_data = jsonb_build_object(
  'geminiKey', 'AIzaSyARpueH2oQddQ5vWS-4vY03SeNHPcpO470',
  'provider', 'gemini'
)
WHERE key_name = 'aiConfig';

-- Se não existir coluna provider/geminiKey, adicione (opcional)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS geminiKey text;

-- Verifique
SELECT * FROM public.settings WHERE key_name = 'aiConfig';
