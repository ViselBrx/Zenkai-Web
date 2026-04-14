-- ====================================================================
-- CORREÇÃO COMPLETA: LOJA, COMPRAS E ESPECIAIS
-- ====================================================================
-- Execute no SQL Editor do Supabase: Dashboard → SQL Editor → New Query
-- Este script corrige o problema de carregamento infinito dos itens
-- comprados na loja (especialmente para davizeravisel@gmail.com)
-- ====================================================================

-- ===== PASSO 1: GARANTIR QUE A COLUNA store_data EXISTE =====
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_data JSONB DEFAULT NULL;

-- Garantir que NULL vira objeto vazio (evita erros no JS)
UPDATE public.profiles 
SET store_data = COALESCE(store_data, '{"purchased": [], "equipped": {}}'::jsonb)
WHERE store_data IS NULL;

-- ===== PASSO 2: CRIAR/RESETAR POLÍTICAS RLS =====
-- Primeiro, remova políticas antigas que possam bloquear
DROP POLICY IF EXISTS "Qualquer um pode ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem editar seu próprio perfil" ON public.profiles;

-- Leitura: apenas o próprio usuário (protege store_data)
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Inserção: o próprio usuário cria seu perfil
CREATE POLICY "Usuários podem criar seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Atualização: o usuário pode editar TUDO no seu perfil (incluindo store_data)
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ===== PASSO 3: CRIAR/ATUALIZAR A RPC DE SALVAR STORE_DATA =====
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
    COALESCE(p_store, '{"purchased": [], "equipped": {}}'::jsonb),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    store_data = EXCLUDED.store_data,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.animehouse_save_store_data(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.animehouse_save_store_data(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.animehouse_save_store_data(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.animehouse_save_store_data(jsonb) TO anon;

-- ===== PASSO 4: ATUALIZAR TRIGGER DE NOVOS USUÁRIOS =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, store_data)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    '{"purchased": [], "equipped": {}, "xp": 0, "rank": "Novato"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PASSO 5: VERIFICAÇÃO - MOSTRAR ESTADO ATUAL =====
-- Verificar se o store_data está sendo salvo corretamente
SELECT 
  id,
  username,
  store_data IS NOT NULL as has_store_data,
  jsonb_typeof(store_data) as store_data_type,
  COALESCE(jsonb_array_length(store_data->'purchased'), 0) as purchased_count,
  store_data->'equipped' IS NOT NULL as has_equipped
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 20;

-- ===== PASSO 6: DIAGNÓSTICO =====
-- Verificar se há algum erro nas políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar se a função RPC existe
SELECT 
  routine_name,
  data_type
FROM information_schema.routines
WHERE routine_name = 'animehouse_save_store_data'
AND routine_schema = 'public';

-- Verificar Grants da função
SELECT 
  grantee,
  privilege_type,
  specific_name
FROM information_schema.routine_privileges
WHERE specific_name LIKE '%animehouse_save_store_data%';

SELECT '✅ Script executado com sucesso! Agora limpe o localStorage do navegador e teste a loja novamente.' AS status;
