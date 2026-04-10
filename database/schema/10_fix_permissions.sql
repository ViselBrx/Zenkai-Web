-- =====================================================
-- FIX: Permissões de Escrita para store_data
-- Execute este script no Supabase SQL Editor se o salvamento de itens falhar
-- =====================================================

-- 1. Garante que a coluna existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_data JSONB DEFAULT '{}'::jsonb;

-- 2. Recria a política de atualização para ser mais robusta
DROP POLICY IF EXISTS "Usuários podem editar seu próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Garante que o gatilho de novo usuário inicialize o store_data como objeto vazio em vez de NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, store_data)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    '{"purchased": [], "equipped": {}}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Log de sucesso
SELECT 'Políticas e gatilhos atualizados com sucesso!' as status;
