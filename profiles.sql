-- 1. Cria a tabela de perfis vinculada aos usuários do sistema
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT,
  avatar_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilita a Segurança de Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Define quem pode ver os perfis (Público: Sim / Apenas Dono: Mude para auth.uid() = id)
CREATE POLICY "Qualquer um pode ver perfis" 
ON public.profiles FOR SELECT 
USING (true);

-- 4. Permite que o usuário crie seu próprio perfil
CREATE POLICY "Usuários podem criar seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Permite que o usuário edite apenas seu próprio perfil
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 6. (OPCIONAL) Automação: Criar perfil vazio automaticamente quando um novo canal/admin se registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, split_part(new.email, '@', 1), 'https://cdn-icons-png.flaticon.com/512/149/149071.png');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dispara a função acima sempre que houver um novo registro no Auth
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
