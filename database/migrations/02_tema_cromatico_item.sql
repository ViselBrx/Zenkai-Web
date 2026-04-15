-- =============================================================================
-- MIGRAÇÃO 02 — SUBSTITUIÇÃO DE ITEM: placa_colecionador → tema_cromatico
-- =============================================================================
-- Executar em: Dashboard do Supabase → SQL Editor → New Query
-- Data: 2025
-- Descrição:
--   Remove referências ao item "placa_colecionador" do inventário comprado
--   dos usuários e registra o novo item "tema_cromatico" (Tema Cromático).
--
--   O Tema Cromático é um item da categoria "tema" que altera toda a
--   identidade visual do site para um espectro cromático animado (rainbow),
--   funcionando igual aos temas nativos (Ben 10, AoT, etc.), porém exclusivo
--   de compra na SenseiMod Store.
--
--   Categoria  : tema
--   Moeda      : esmeralda
--   Preço      : 8 esmeraldas
--   Req. rank  : Patamar Guardião
--   Chave CSS  : theme-cromatico
--   Ativar/des.: window.setTheme('theme-cromatico') | window.setTheme('theme-ciano')
--   localStorage: animehouse_tema_cromatico = 'true' | removido
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. VERIFICAR estado atual antes de modificar (somente leitura)
-- ---------------------------------------------------------------------------
SELECT
  id,
  store_data -> 'purchased'                         AS purchased,
  store_data -> 'equipped'                          AS equipped,
  store_data ->>'ouro'                              AS ouro,
  store_data ->>'diamante'                          AS diamante,
  store_data ->>'esmeralda'                         AS esmeralda
FROM public.profiles
WHERE store_data -> 'purchased' ? 'placa_colecionador'
   OR store_data -> 'purchased' ? 'tema_cromatico'
ORDER BY id;


-- ---------------------------------------------------------------------------
-- 2. REMOVER "placa_colecionador" do array purchased de todos os perfis
--    e ADICIONAR "tema_cromatico" para quem já possuía o item antigo
--    (migração de propriedade adquirida — sem custo extra ao usuário)
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET store_data = jsonb_set(
    -- Remove placa_colecionador do purchased
    jsonb_set(
        store_data,
        '{purchased}',
        (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(COALESCE(store_data -> 'purchased', '[]'::jsonb)) AS elem
            WHERE elem::text <> '"placa_colecionador"'
        )
    ),
    -- Adiciona tema_cromatico no lugar (evita duplicatas com || distinct)
    '{purchased}',
    (
        SELECT jsonb_agg(DISTINCT elem ORDER BY elem)
        FROM (
            SELECT elem
            FROM jsonb_array_elements(
                COALESCE(
                    (
                        SELECT jsonb_agg(e)
                        FROM jsonb_array_elements(COALESCE(store_data -> 'purchased', '[]'::jsonb)) AS e
                        WHERE e::text <> '"placa_colecionador"'
                    ),
                    '[]'::jsonb
                )
            ) AS elem
            UNION ALL
            SELECT '"tema_cromatico"'::jsonb
        ) sub
    )
)
WHERE store_data -> 'purchased' ? 'placa_colecionador';


-- ---------------------------------------------------------------------------
-- 3. LIMPAR equipped.placa_colecionador se existia (campo orphan)
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET store_data = store_data #- '{equipped,placa_colecionador}'
WHERE store_data -> 'equipped' ? 'placa_colecionador';


-- ---------------------------------------------------------------------------
-- 4. VERIFICAÇÃO FINAL — confirmar que a migração foi aplicada
-- ---------------------------------------------------------------------------
SELECT
  id,
  store_data -> 'purchased'  AS purchased_atualizado,
  store_data -> 'equipped'   AS equipped_atualizado
FROM public.profiles
WHERE store_data -> 'purchased' ? 'tema_cromatico'
   OR store_data -> 'purchased' ? 'placa_colecionador'
ORDER BY id;


-- ---------------------------------------------------------------------------
-- 5. COMENTÁRIO — atualizar documentação da coluna store_data
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN public.profiles.store_data IS
'Dados da loja/inventário do usuário:
  - ouro, diamante, esmeralda : fichas disponíveis
  - xp, rank                  : progressão do usuário
  - purchased[]               : IDs dos itens comprados
  - equipped{}                : cosméticos atualmente equipados
      .aura      → id da aura ativa (ex: "aura_dragon")
      .banner    → id do banner ativo
      .titulo    → título personalizado
      .crown     → bool — coroa visível
      .crownId   → id da coroa equipada
      .tema_cromatico → bool — Tema Cromático ativo (item de compra)

ITENS VIGENTES (categoria "tema"):
  - tema_cromatico  : Tema Cromático — espectro rainbow animado na UI
    Substitui: placa_colecionador (removido na migração 02)
    Moeda: esmeralda | Preço: 8 | Req: Guardião';


-- ---------------------------------------------------------------------------
SELECT '✅ Migração 02 executada: placa_colecionador → tema_cromatico.' AS status;
-- ---------------------------------------------------------------------------
