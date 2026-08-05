-- =====================================================
-- MIGRATION: Adiciona restrições e cooldown para username
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna para rastrear a última mudança de username
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_username_update TIMESTAMP WITH TIME ZONE;

-- 2. Limpar os dados antigos para não violar as novas regras com tratamento de duplicatas
DO $$ 
DECLARE 
  r RECORD;
  new_un TEXT;
  base_un TEXT;
  counter INT;
BEGIN
  FOR r IN SELECT id, username FROM public.profiles LOOP
    -- Limpa os caracteres
    base_un := lower(regexp_replace(r.username, '[^a-zA-Z0-9_]', '', 'g'));
    
    -- Ajusta o prefixo e tamanho mínimo
    IF base_un ~ '^[^a-z]' OR length(base_un) < 3 THEN
      base_un := 'u_' || base_un;
    END IF;
    
    -- Ajusta o tamanho máximo
    base_un := substring(base_un from 1 for 15);
    
    -- Pula se já estiver tudo certo e dentro das regras
    IF base_un = r.username AND r.username ~ '^[a-z][a-z0-9_]{2,14}$' THEN
      CONTINUE;
    END IF;

    new_un := base_un;
    counter := 1;
    
    -- Verifica se já existe esse username em OUTRO usuário
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_un AND id != r.id) LOOP
      new_un := substring(base_un from 1 for 10) || '_' || counter::text;
      counter := counter + 1;
    END LOOP;
    
    UPDATE public.profiles SET username = new_un WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Adicionar uma restrição CHECK para garantir as regras do username em novos cadastros e atualizações
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS username_format_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT username_format_check 
  CHECK (username ~ '^[a-z][a-z0-9_]{2,14}$');
