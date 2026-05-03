-- 1. Cria a tabela de perfis vinculada aos usuários do sistema
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT,
  avatar_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilita a Segurança de Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Cada usuário só lê a própria linha (store_data / loja não vazam entre contas)
CREATE POLICY "profiles_select_own" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 4. Permite que o usuário crie seu próprio perfil
CREATE POLICY "Usuários podem criar seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Permite que o usuário edite apenas seu próprio perfil
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 6. (OPCIONAL) Automação: Criar perfil vazio automaticamente quando um novo canal/admin se registrar e confirmar o email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Cria o perfil apenas se o e-mail estiver confirmado
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (NEW.id, split_part(NEW.email, '@', 1), 'https://cdn-icons-png.flaticon.com/512/149/149071.png')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dispara a função acima sempre que houver um novo registro no Auth ou quando ele for atualizado (email confirmado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
