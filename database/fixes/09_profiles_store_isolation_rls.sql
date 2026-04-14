-- =============================================================================
-- ISOLAMENTO DO INVENTÁRIO / LOJA (profiles.store_data)
-- =============================================================================
-- Problema: política "SELECT USING (true)" permitia ler TODAS as linhas de
-- public.profiles. Qualquer sessão via PostgREST podia ver store_data de outros.
-- Correção: cada usuário só SELECT / UPDATE / INSERT na própria linha (id = auth.uid()).
--
-- Execute no Supabase: SQL Editor → Run
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem editar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Gatilho de signup continua com SECURITY DEFINER (insere perfil sem passar por RLS do cliente).

-- Opcional (emergência): se um script atualizou TODOS os perfis com o mesmo inventário,
-- descomente para zerar purchased/equipped em todas as contas (perde compras no JSON — use backup).
-- UPDATE public.profiles
-- SET store_data = COALESCE(store_data, '{}'::jsonb)
--     || jsonb_build_object('purchased', '[]'::jsonb, 'equipped', '{}'::jsonb);

SELECT 'RLS de profiles: cada usuário só acessa a própria linha.' AS status;
