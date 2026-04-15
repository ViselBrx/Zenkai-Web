-- 1) Ver quantos itens cada perfil tem em store_data (como postgres / SQL Editor).
SELECT
  id,
  jsonb_array_length(COALESCE(store_data->'purchased', '[]'::jsonb)) AS qtd_compras,
  store_data->'purchased' AS compras
FROM public.profiles
ORDER BY qtd_compras DESC;

-- 2) Se a conta SECUNDÁRIA já gravou inventário errado no banco, zere só ela (troque o UUID):
--
-- UPDATE public.profiles
-- SET store_data = COALESCE(store_data, '{}'::jsonb)
--     || jsonb_build_object('purchased', '[]'::jsonb, 'equipped', '{}'::jsonb),
--     updated_at = now()
-- WHERE id = 'COLE_UUID_DA_CONTA_SECUNDARIA'::uuid;
