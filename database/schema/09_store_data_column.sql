-- =====================================================
-- MIGRATION: Adiciona a coluna 'store_data' na tabela profiles
-- Execute este script no Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Colar e executar
-- =====================================================

-- 1. Adiciona a coluna store_data (JSONB) na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_data JSONB DEFAULT NULL;

-- 2. Comentário explicativo
COMMENT ON COLUMN public.profiles.store_data IS 
  'Dados da loja/inventário do usuário: fichas (ouro, diamante, esmeralda), XP, itens comprados (purchased[]) e itens equipados (equipped{})';

-- 3. Verificação: após rodar, este SELECT deve mostrar a coluna
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'store_data';
