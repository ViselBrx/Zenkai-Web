/**
 * AnimeHouse - Schema de Filmes de Animes
 * =====================================
 * Este script cria a tabela necessária para salvar filmes dentro da categoria de Animes.
 */

CREATE TABLE IF NOT EXISTS public.anime_movies (
    id TEXT PRIMARY KEY,
    anime_id TEXT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    iframe TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.anime_movies ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Leitura Pública Anime Movies" ON public.anime_movies FOR SELECT USING (true);
CREATE POLICY "Escrita Autenticada Anime Movies" ON public.anime_movies FOR ALL USING (auth.role() = 'authenticated');
