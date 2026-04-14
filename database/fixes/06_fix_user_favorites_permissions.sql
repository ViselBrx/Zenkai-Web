-- =====================================================
-- FIX: Favoritos retornam "Faça login" mesmo logado
-- Causa comum: falta de GRANT/policies na tabela user_favorites
-- =====================================================

-- 1) Garantir tabela
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    cover_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, content_id, content_type)
);

-- 1b) Tabelas antigas sem cover_url/title/metadata: PostgREST acusa "cover_url not in schema cache"
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2) Grants explícitos
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT SELECT ON public.user_favorites TO anon;

-- 3) RLS e policies
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus próprios favoritos" ON public.user_favorites;
CREATE POLICY "Usuários podem ver seus próprios favoritos"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios favoritos" ON public.user_favorites;
CREATE POLICY "Usuários podem inserir seus próprios favoritos"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios favoritos" ON public.user_favorites;
CREATE POLICY "Usuários podem deletar seus próprios favoritos"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_content_id ON public.user_favorites(content_id);

SELECT 'Favoritos prontos: grants + RLS OK' AS status;
