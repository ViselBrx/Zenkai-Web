-- ====================================================================
-- SCRIPT DE CORREÇÃO DEFINITIVA: LOJA, COMPRAS E AURAS
-- ====================================================================
-- Onde executar: Dashboard do Supabase -> SQL Editor -> New Query
-- Objetivo: Criar a coluna de inventário, limpar permissões e garantir o salvamento.
-- ====================================================================

-- 1. GARANTIR QUE A COLUNA EXISTE COM O FORMATO CORRETO (JSONB)
-- Se ela já existir, este comando não fará nada.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_data JSONB DEFAULT '{"purchased": [], "equipped": {}}'::jsonb;

-- 2. RESETAR POLÍTICAS DE SEGURANÇA (RLS) PARA O PERFIL
-- Isso garante que o sistema tenha permissão para LER e GRAVAR no seu perfil.
DROP POLICY IF EXISTS "Qualquer um pode ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem editar seu próprio perfil" ON public.profiles;

-- Leitura: apenas o próprio usuário (evita vazar store_data / inventário)
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Permissão de Inserção (O próprio usuário cria seu perfil ao registrar)
CREATE POLICY "Usuários podem criar seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Permissão de Atualização (O usuário pode editar TUDO no seu perfil, incluindo a loja)
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. ATUALIZAR O GATILHO DE NOVOS USUÁRIOS
-- Garante que todo mundo que se cadastrar já comece com o inventário pronto.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, store_data)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    '{"purchased": [], "equipped": {}, "ouro": 0, "diamante": 0, "esmeralda": 0, "xp": 0}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CORREÇÃO PARA USUÁRIOS EXISTENTES
-- Se o seu 'store_data' estiver nulo (NULL), ele será transformado em um objeto vazio
-- para que o JavaScript consiga adicionar itens nele sem dar erro.
UPDATE public.profiles 
SET store_data = '{"purchased": [], "equipped": {}}'::jsonb 
WHERE store_data IS NULL;

-- 5. VERIFICAÇÃO FINAL
SELECT 'Banco de dados atualizado! Agora a loja e o perfil devem sincronizar corretamente.' as resultado;
