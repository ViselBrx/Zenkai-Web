/**
 * AnimeHouse - Database Schema (PostgreSQL / Supabase)
 * ====================================================
 * Execute este script no SQL Editor do Supabase para criar as tabelas
 * baseadas na estrutura exata do seu antigo data.json.
 */

-- 1. Desenhos Clássicos
CREATE TABLE public.cartoons (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    produtora TEXT,
    temporadas INTEGER DEFAULT 1,
    capa TEXT,
    created_at BIGINT
);

-- 2. Episódios de Desenhos
-- Relaciona com a tabela cartoons (se o desenho for deletado, os eps somem)
CREATE TABLE public.episodes (
    id TEXT PRIMARY KEY,
    cartoon_id TEXT NOT NULL REFERENCES public.cartoons(id) ON DELETE CASCADE,
    temporada TEXT NOT NULL,
    ep_number INTEGER NOT NULL,
    title TEXT,
    iframe TEXT NOT NULL
);

-- 3. Filmes Animados (Ligados aos Desenhos)
CREATE TABLE public.movies (
    id TEXT PRIMARY KEY,
    cartoon_id TEXT NOT NULL REFERENCES public.cartoons(id) ON DELETE CASCADE,
    title TEXT,
    iframe TEXT NOT NULL
);

-- 4. Animes
CREATE TABLE public.animes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    estudio TEXT,
    genero TEXT,
    temporadas INTEGER DEFAULT 1,
    capa TEXT,
    created_at BIGINT
);

-- 5. Episódios de Animes
-- Inclui o campo 'idioma' para separar dublado de legendado
CREATE TABLE public.anime_episodes (
    id TEXT PRIMARY KEY,
    anime_id TEXT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    idioma TEXT NOT NULL CHECK (idioma IN ('dublado', 'legendado')),
    temporada TEXT NOT NULL,
    ep_number INTEGER NOT NULL,
    title TEXT,
    iframe TEXT NOT NULL
);

-- 6. Mangás
CREATE TABLE public.mangas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    autor TEXT,
    capitulos INTEGER DEFAULT 1,
    capa TEXT,
    link_drive TEXT,
    created_at BIGINT
);

-- 7. Configurações Globais (Tema do Site, Chaves de AI, etc)
CREATE TABLE public.settings (
    key_name TEXT PRIMARY KEY,
    config_data JSONB NOT NULL
);


-- ==========================================
-- CONFIGURAÇÕES DE SEGURANÇA (RLS)
-- ==========================================
-- Isso garante que visitantes comuns leiam o banco de dados (para assistir o site),
-- mas a edição e cadastro de conteúdo seja FECHADO, apenas para vocês quando logados!

ALTER TABLE public.cartoons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Permite LEITURA (SELECT) para todos os usuários públicos
CREATE POLICY "Leitura Pública Cartoons" ON public.cartoons FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Animes" ON public.animes FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Anime Eps" ON public.anime_episodes FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Mangas" ON public.mangas FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Settings" ON public.settings FOR SELECT USING (true);

-- Permite ESCRITA (INSERT, UPDATE, DELETE) APENAS para os logados (Você e seu amigo)
CREATE POLICY "Escrita Autenticada Cartoons" ON public.cartoons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Episodes" ON public.episodes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Movies" ON public.movies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Animes" ON public.animes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Anime Eps" ON public.anime_episodes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Mangas" ON public.mangas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita Autenticada Settings" ON public.settings FOR ALL USING (auth.role() = 'authenticated');
