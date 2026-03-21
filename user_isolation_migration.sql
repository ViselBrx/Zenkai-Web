-- Adicionar coluna user_id em todas as tabelas e criar índices para melhor performance
-- Execute este arquivo no Supabase SQL Editor para migrar para dados isolados por usuário

-- 1. CARTOONS - Adicionar user_id e índice
ALTER TABLE cartoons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cartoons_user_id ON cartoons(user_id);

-- 2. EPISODES - Adicionar user_id e índice
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);

-- 3. MOVIES - Adicionar user_id e índice
ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);

-- 4. ANIMES - Adicionar user_id e índice
ALTER TABLE animes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_animes_user_id ON animes(user_id);

-- 5. ANIME_EPISODES - Adicionar user_id e índice
ALTER TABLE anime_episodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_anime_episodes_user_id ON anime_episodes(user_id);

-- 6. MANGAS - Adicionar user_id e índice
ALTER TABLE mangas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_mangas_user_id ON mangas(user_id);

-- 7. MANGA_VOLUMES - Adicionar user_id e índice
ALTER TABLE manga_volumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_manga_volumes_user_id ON manga_volumes(user_id);

-- 8. MANGA_NOTES - Adicionar user_id e índice
ALTER TABLE manga_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_manga_notes_user_id ON manga_notes(user_id);

-- 9. FILMES - Adicionar user_id e índice (se a tabela existir)
ALTER TABLE filmes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_filmes_user_id ON filmes(user_id);

-- 10. Ativar RLS (Row Level Security) para garantir isolamento
-- Cartoons RLS
ALTER TABLE cartoons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cartoons_user_policy ON cartoons;
CREATE POLICY cartoons_user_policy ON cartoons
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Episodes RLS
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS episodes_user_policy ON episodes;
CREATE POLICY episodes_user_policy ON episodes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Movies RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS movies_user_policy ON movies;
CREATE POLICY movies_user_policy ON movies
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Animes RLS
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS animes_user_policy ON animes;
CREATE POLICY animes_user_policy ON animes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Anime Episodes RLS
ALTER TABLE anime_episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anime_episodes_user_policy ON anime_episodes;
CREATE POLICY anime_episodes_user_policy ON anime_episodes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Mangas RLS
ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mangas_user_policy ON mangas;
CREATE POLICY mangas_user_policy ON mangas
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Manga Volumes RLS
ALTER TABLE manga_volumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS manga_volumes_user_policy ON manga_volumes;
CREATE POLICY manga_volumes_user_policy ON manga_volumes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Manga Notes RLS
ALTER TABLE manga_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS manga_notes_user_policy ON manga_notes;
CREATE POLICY manga_notes_user_policy ON manga_notes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Filmes RLS (se a tabela existir)
ALTER TABLE filmes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS filmes_user_policy ON filmes;
CREATE POLICY filmes_user_policy ON filmes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Nota: RLS vai automaticamente filtrar os dados quando o usuário está logado
-- Dados existentes (sem user_id) podem ser vistos por todos até serem editados
