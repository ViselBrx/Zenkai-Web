-- 1. Drop the old case-sensitive unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_username;

-- 2. Create a case-insensitive UNIQUE index on username
CREATE UNIQUE INDEX IF NOT EXISTS unique_username_lower_idx ON public.profiles (LOWER(username));

-- 3. Modify the handle_new_user trigger to avoid insert failures on duplicate email prefixes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Pega o prefixo do e-mail e corta para 15 caracteres (para dar espaço a um sufixo se precisar)
    base_username := SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 15);
    final_username := base_username;

    -- Loop para garantir que o nome seja único
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
      final_username := base_username || counter::text;
      counter := counter + 1;
    END LOOP;

    -- Tenta inserir o perfil usando o final_username que sabemos ser único
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (NEW.id, final_username, 'https://cdn-icons-png.flaticon.com/512/149/149071.png')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
