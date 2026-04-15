-- =============================================================================
-- DESBLOQUEAR TODAS AS PATENTES PARA O DONO (davizeravisel@gmail.com)
-- =============================================================================
-- Este script adiciona a flag 'all_ranks_unlocked' ao store_data do dono,
-- permitindo que todas as patentes apareçam desbloqueadas sem alterar o XP.
--
-- Execute no SQL Editor do Supabase (role postgres / service)
-- =============================================================================

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
    
    -- Adicionar flag all_ranks_unlocked e manter patentes existentes
    UPDATE public.profiles
    SET store_data = COALESCE(store_data, '{}'::jsonb) 
        || jsonb_build_object(
            'all_ranks_unlocked', true,
            'unlocked_ranks', '["Bronze","Prata","Ouro","Mestre","Lenda","Hokage","Guardião","Imortal"]'::jsonb
        ),
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Todas as patentes desbloqueadas para davizeravisel@gmail.com!';
    RAISE NOTICE 'Novo store: %', (SELECT store_data FROM public.profiles WHERE id = v_user_id);
END $$;

-- Verificação final
SELECT 
    p.id,
    u.email,
    p.store_data->>'all_ranks_unlocked' AS all_ranks_unlocked,
    p.store_data->>'unlocked_ranks' AS unlocked_ranks,
    p.store_data->>'ouro' AS ouro,
    p.store_data->>'diamante' AS diamante,
    p.store_data->>'esmeralda' AS esmeralda
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'davizeravisel@gmail.com';
