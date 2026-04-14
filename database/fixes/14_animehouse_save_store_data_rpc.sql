-- =============================================================================
-- Persistência confiável de store_data (inventário da loja)
-- =============================================================================
-- Rode no SQL Editor do Supabase (Dashboard → SQL → New query) DEPOIS do
-- database/fixes/99_final_store_fix.sql se o cliente ainda não gravar compras.
--
-- O que faz: função SECURITY DEFINER que faz INSERT ... ON CONFLICT DO UPDATE
-- só em store_data/updated_at, usando auth.uid(). Evita casos em que o
-- PostgREST retorna 0 linhas no UPDATE ou políticas RLS atrapalham o upsert
-- via REST.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.animehouse_save_store_data(p_store jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  BEGIN
    SELECT split_part(au.email::text, '@', 1) INTO v_username
    FROM auth.users au
    WHERE au.id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_username := NULL;
  END;

  IF v_username IS NULL OR length(trim(v_username)) = 0 THEN
    v_username := 'user';
  END IF;

  INSERT INTO public.profiles (id, username, avatar_url, store_data, updated_at)
  VALUES (
    auth.uid(),
    v_username,
    'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    COALESCE(p_store, '{}'::jsonb),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    store_data = EXCLUDED.store_data,
    updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.animehouse_save_store_data(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.animehouse_save_store_data(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.animehouse_save_store_data(jsonb) TO service_role;

SELECT 'Função animehouse_save_store_data criada. Teste uma compra na loja.' AS status;
