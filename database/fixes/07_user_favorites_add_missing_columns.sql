-- Erro: Could not find the 'cover_url' column of 'user_favorites' in the schema cache
-- Causa: tabela criada antes do schema completo. Rode no SQL Editor do Supabase (uma vez).

ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

SELECT 'Colunas user_favorites alinhadas' AS status;
