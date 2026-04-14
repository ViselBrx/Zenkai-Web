-- Limpa inventário herdado por engano (purchased + equipped) num perfil específico.
-- Mantém o resto do store_data (xp, moedas, rank, etc.).
--
-- Passo 1 — achar o UUID (SQL Editor do Supabase, ou Authentication → Users):
--   SELECT id, email FROM auth.users ORDER BY created_at DESC;
--
-- Passo 2 — substitua o UUID abaixo e execute só o UPDATE.

UPDATE public.profiles
SET store_data = COALESCE(store_data, '{}'::jsonb)
    || jsonb_build_object(
         'purchased', '[]'::jsonb,
         'equipped', '{}'::jsonb
       ),
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;  -- ← troque pelo UUID da conta secundária

-- Confira:
-- SELECT id, store_data->'purchased', store_data->'equipped' FROM public.profiles WHERE id = '...'::uuid;
