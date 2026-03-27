-- Fix 05: Restaurar catálogos antigos na conta principal
-- Uso:
-- 1) Execute no Supabase SQL Editor.
-- 2) Ajuste o email abaixo se necessário.

DO $$
DECLARE
  v_main_email text := 'davizeravisel@gmail.com';
  v_main_user_id uuid;
BEGIN
  SELECT id
    INTO v_main_user_id
    FROM auth.users
   WHERE lower(email) = lower(v_main_email)
   LIMIT 1;

  IF v_main_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário principal não encontrado para o email: %', v_main_email;
  END IF;

  -- Atribui itens antigos sem dono (user_id nulo) para a conta principal.
  UPDATE public.cartoons       SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.episodes       SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.movies         SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.animes         SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.anime_episodes SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.mangas         SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.manga_volumes  SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.manga_notes    SET user_id = v_main_user_id WHERE user_id IS NULL;
  UPDATE public.filmes         SET user_id = v_main_user_id WHERE user_id IS NULL;
END $$;

-- Verificação rápida
SELECT 'cartoons' AS tabela, count(*) FILTER (WHERE user_id IS NULL) AS sem_dono FROM public.cartoons
UNION ALL SELECT 'episodes', count(*) FILTER (WHERE user_id IS NULL) FROM public.episodes
UNION ALL SELECT 'movies', count(*) FILTER (WHERE user_id IS NULL) FROM public.movies
UNION ALL SELECT 'animes', count(*) FILTER (WHERE user_id IS NULL) FROM public.animes
UNION ALL SELECT 'anime_episodes', count(*) FILTER (WHERE user_id IS NULL) FROM public.anime_episodes
UNION ALL SELECT 'mangas', count(*) FILTER (WHERE user_id IS NULL) FROM public.mangas
UNION ALL SELECT 'manga_volumes', count(*) FILTER (WHERE user_id IS NULL) FROM public.manga_volumes
UNION ALL SELECT 'manga_notes', count(*) FILTER (WHERE user_id IS NULL) FROM public.manga_notes
UNION ALL SELECT 'filmes', count(*) FILTER (WHERE user_id IS NULL) FROM public.filmes;
