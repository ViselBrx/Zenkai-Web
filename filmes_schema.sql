/**
 * AnimeHouse - Schema de Filmes
 * ============================
 * Execute este script no SQL Editor do Supabase para criar a tabela de filmes.
 * Este script é INDEPENDENTE e pode ser rodado separadamente do supabase_schema.sql principal.
 */

-- Tabela de Filmes (independente, não ligada a cartoons nem animes)
CREATE TABLE public.filmes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    ano INTEGER,
    genero TEXT,
    diretor TEXT,
    capa TEXT,
    iframe TEXT NOT NULL,
    created_at BIGINT
);

-- Habilitar Segurança por Linha (RLS)
ALTER TABLE public.filmes ENABLE ROW LEVEL SECURITY;

-- Permite LEITURA para todos os usuários públicos
CREATE POLICY "Leitura Pública Filmes" ON public.filmes FOR SELECT USING (true);

-- Permite ESCRITA apenas para usuários autenticados (você e seu amigo)
CREATE POLICY "Escrita Autenticada Filmes" ON public.filmes FOR ALL USING (auth.role() = 'authenticated');
