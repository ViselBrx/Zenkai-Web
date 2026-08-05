-- =====================================================
-- MIGRATION: Adiciona a coluna 'full_name' na tabela profiles
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adiciona a coluna full_name na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Atualiza a função handle_new_user para preencher o full_name inicialmente com o username gerado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Pega o prefixo do e-mail e corta para 15 caracteres
    base_username := SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 15);
    final_username := base_username;

    -- Loop para garantir que o username seja único
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
      final_username := base_username || counter::text;
      counter := counter + 1;
    END LOOP;

    -- Tenta inserir o perfil, agora preenchendo full_name também com o prefixo
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (NEW.id, final_username, final_username, 'https://cdn-icons-png.flaticon.com/512/149/149071.png')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
