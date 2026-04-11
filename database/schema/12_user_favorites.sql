/**
 * AnimeHouse - Sistema de Favoritos
 * ================================
 * Cria a tabela para armazenar os favoritos dos usuários (Animes, Mangás, Filmes e Desenhos).
 */

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'anime', 'manga', 'filme', 'desenho'
    title TEXT, -- Título do item para exibição rápida
    cover_url TEXT, -- URL da capa para exibição rápida
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Garante que um usuário não favorite o mesmo item duas vezes na mesma categoria
    UNIQUE(user_id, content_id, content_type)
);

-- Habilitar RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Usuários podem ver seus próprios favoritos"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios favoritos"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios favoritos"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_content_id ON public.user_favorites(content_id);
