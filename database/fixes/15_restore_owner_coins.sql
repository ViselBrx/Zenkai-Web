-- =============================================================================
-- RESTAURAR MOEDAS DO DONO (davizeravisel@gmail.com)
-- =============================================================================
-- Este script restaura 1000 ouro, 1000 diamante e 1000 esmeralda 
-- para a conta do dono do site.
--
-- Execute no SQL Editor do Supabase (role postgres / service)
-- =============================================================================

-- 1. Primeiro, encontre o UUID do usuário pelo email
DO $$
DECLARE
    v_user_id UUID;
    v_current_store JSONB;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'davizeravisel@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário davizeravisel@gmail.com não encontrado!';
    END IF;
    
    -- Verificar store_data atual
    SELECT store_data INTO v_current_store
    FROM public.profiles
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;
    RAISE NOTICE 'Store atual: %', v_current_store;
    
    -- Restaurar/criar store_data com 1000 de cada moeda
    UPDATE public.profiles
    SET store_data = COALESCE(store_data, '{}'::jsonb) 
        || jsonb_build_object(
            'ouro', 1000,
            'diamante', 1000,
            'esmeralda', 1000,
            'purchased', COALESCE(store_data->'purchased', '[]'::jsonb),
            'equipped', COALESCE(store_data->'equipped', '{}'::jsonb),
            'xp', COALESCE(store_data->'xp', 0)
        ),
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Moedas restauradas com sucesso para davizeravisel@gmail.com!';
    RAISE NOTICE 'Novo store: %', (SELECT store_data FROM public.profiles WHERE id = v_user_id);
END $$;

-- 2. Verificação final
SELECT 
    p.id,
    u.email,
    p.store_data->>'ouro' AS ouro,
    p.store_data->>'diamante' AS diamante,
    p.store_data->>'esmeralda' AS esmeralda,
    jsonb_array_length(COALESCE(p.store_data->'purchased', '[]'::jsonb)) AS itens_comprados
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'davizeravisel@gmail.com';
