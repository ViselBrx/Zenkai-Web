-- Fix 04: Isolamento estrito de catálogo por usuário
-- Objetivo:
-- 1) Garantir user_id em todas as tabelas de catálogo
-- 2) Definir dono automático no INSERT (auth.uid())
-- 3) Reforçar RLS para cada conta ver/editar apenas o próprio catálogo

-- ==========================================
-- 1) Garantir colunas user_id e defaults
-- ==========================================
ALTER TABLE public.cartoons       ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.episodes       ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.movies         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.animes         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.anime_episodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.mangas         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.manga_volumes  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.manga_notes    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.filmes         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.cartoons       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.episodes       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.movies         ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.animes         ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.anime_episodes ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.mangas         ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.manga_volumes  ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.manga_notes    ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.filmes         ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_cartoons_user_id       ON public.cartoons(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_id       ON public.episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_id         ON public.movies(user_id);
CREATE INDEX IF NOT EXISTS idx_animes_user_id         ON public.animes(user_id);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_user_id ON public.anime_episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_mangas_user_id         ON public.mangas(user_id);
CREATE INDEX IF NOT EXISTS idx_manga_volumes_user_id  ON public.manga_volumes(user_id);
CREATE INDEX IF NOT EXISTS idx_manga_notes_user_id    ON public.manga_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_filmes_user_id         ON public.filmes(user_id);

-- Trigger para preencher user_id quando vier nulo
CREATE OR REPLACE FUNCTION public.set_user_id_if_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_user_id_cartoons ON public.cartoons;
DROP TRIGGER IF EXISTS trg_set_user_id_episodes ON public.episodes;
DROP TRIGGER IF EXISTS trg_set_user_id_movies ON public.movies;
DROP TRIGGER IF EXISTS trg_set_user_id_animes ON public.animes;
DROP TRIGGER IF EXISTS trg_set_user_id_anime_episodes ON public.anime_episodes;
DROP TRIGGER IF EXISTS trg_set_user_id_mangas ON public.mangas;
DROP TRIGGER IF EXISTS trg_set_user_id_manga_volumes ON public.manga_volumes;
DROP TRIGGER IF EXISTS trg_set_user_id_manga_notes ON public.manga_notes;
DROP TRIGGER IF EXISTS trg_set_user_id_filmes ON public.filmes;

CREATE TRIGGER trg_set_user_id_cartoons
BEFORE INSERT ON public.cartoons
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_episodes
BEFORE INSERT ON public.episodes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_movies
BEFORE INSERT ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_animes
BEFORE INSERT ON public.animes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_anime_episodes
BEFORE INSERT ON public.anime_episodes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_mangas
BEFORE INSERT ON public.mangas
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_manga_volumes
BEFORE INSERT ON public.manga_volumes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_manga_notes
BEFORE INSERT ON public.manga_notes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

CREATE TRIGGER trg_set_user_id_filmes
BEFORE INSERT ON public.filmes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_if_null();

-- ==========================================
-- 2) RLS estrito por dono
-- ==========================================
ALTER TABLE public.cartoons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filmes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cartoons_user_policy ON public.cartoons;
DROP POLICY IF EXISTS episodes_user_policy ON public.episodes;
DROP POLICY IF EXISTS movies_user_policy ON public.movies;
DROP POLICY IF EXISTS animes_user_policy ON public.animes;
DROP POLICY IF EXISTS anime_episodes_user_policy ON public.anime_episodes;
DROP POLICY IF EXISTS mangas_user_policy ON public.mangas;
DROP POLICY IF EXISTS manga_volumes_user_policy ON public.manga_volumes;
DROP POLICY IF EXISTS manga_notes_user_policy ON public.manga_notes;
DROP POLICY IF EXISTS filmes_user_policy ON public.filmes;

DROP POLICY IF EXISTS cartoons_owner_only ON public.cartoons;
DROP POLICY IF EXISTS episodes_owner_only ON public.episodes;
DROP POLICY IF EXISTS movies_owner_only ON public.movies;
DROP POLICY IF EXISTS animes_owner_only ON public.animes;
DROP POLICY IF EXISTS anime_episodes_owner_only ON public.anime_episodes;
DROP POLICY IF EXISTS mangas_owner_only ON public.mangas;
DROP POLICY IF EXISTS manga_volumes_owner_only ON public.manga_volumes;
DROP POLICY IF EXISTS manga_notes_owner_only ON public.manga_notes;
DROP POLICY IF EXISTS filmes_owner_only ON public.filmes;

CREATE POLICY cartoons_owner_only ON public.cartoons
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY episodes_owner_only ON public.episodes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY movies_owner_only ON public.movies
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY animes_owner_only ON public.animes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY anime_episodes_owner_only ON public.anime_episodes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY mangas_owner_only ON public.mangas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY manga_volumes_owner_only ON public.manga_volumes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY manga_notes_owner_only ON public.manga_notes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY filmes_owner_only ON public.filmes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3) Auditoria rápida (opcional)
-- ==========================================
-- Rode este SELECT para detectar registros sem dono:
-- SELECT 'cartoons' AS tabela, count(*) AS total, count(*) FILTER (WHERE user_id IS NULL) AS sem_dono FROM public.cartoons
-- UNION ALL
-- SELECT 'episodes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.episodes
-- UNION ALL
-- SELECT 'movies', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.movies
-- UNION ALL
-- SELECT 'animes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.animes
-- UNION ALL
-- SELECT 'anime_episodes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.anime_episodes
-- UNION ALL
-- SELECT 'mangas', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.mangas
-- UNION ALL
-- SELECT 'manga_volumes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.manga_volumes
-- UNION ALL
-- SELECT 'manga_notes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.manga_notes
-- UNION ALL
-- SELECT 'filmes', count(*), count(*) FILTER (WHERE user_id IS NULL) FROM public.filmes;
