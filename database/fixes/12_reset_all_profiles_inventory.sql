-- =============================================================================
-- ZERA O INVENTÁRIO DA LOJA PARA TODOS OS USUÁRIOS
-- =============================================================================
-- AVISO: Depois de executar este script, o campo store_data no Postgres terá
-- purchased = [] e equipped = {} para TODAS as contas. O site só voltará a
-- mostrar itens no servidor após novas compras ou restauração de backup.
-- Para CONFERIR antes/depois (somente leitura): database/fixes/11_inspect_profiles_store.sql
--
-- Remove todos os itens de store_data.purchased e store_data.equipped.
-- Mantém: xp, ouro, diamante, esmeralda, rank, unlocked_ranks e demais chaves.
-- (Não simula "venda" com devolução de fichas — só esvazia o inventário.)
--
-- Rode UMA VEZ no SQL Editor do Supabase (role postgres / service).
-- Depois: peça para usuários darem F5 ou limpar cache do site se ainda vir lixo local.
--
-- Segurança (evitar ler inventário de outro): se ainda não rodou, execute também:
--   database/fixes/10_profiles_nuclear_policies.sql
-- =============================================================================

UPDATE public.profiles
SET store_data = COALESCE(store_data, '{}'::jsonb)
    || jsonb_build_object(
         'purchased', '[]'::jsonb,
         'equipped', '{}'::jsonb
       ),
    updated_at = now();

-- Conferência
SELECT
  count(*) AS total_perfis,
  sum(jsonb_array_length(COALESCE(store_data->'purchased', '[]'::jsonb))) AS total_itens_restantes
FROM public.profiles;
-- total_itens_restantes deve ser 0
