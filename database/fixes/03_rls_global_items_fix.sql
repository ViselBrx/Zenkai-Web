-- ======================================================================
-- 03_rls_global_items_fix.sql
-- FIX: Permissões para Administrador e Isolamento de Usuários
-- ======================================================================

-- 1. Limpa políticas antigas para garantir estado limpo
DO $$ 
DECLARE
    t text;
    p text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('animes', 'cartoons', 'filmes', 'mangas', 'hqs', 'episodes', 'manga_volumes', 'hq_editions')
    LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p, t);
        END LOOP;
    END LOOP;
END $$;

-- 2. Habilita RLS em todas as tabelas
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoons ENABLE ROW LEVEL SECURITY;
ALTER TABLE filmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_editions ENABLE ROW LEVEL SECURITY;

-- 3. Define função para verificar se o usuário é Admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  -- Verifica se o email do usuário logado é o do administrador
  RETURN (
    SELECT email = 'davizeravisel@gmail.com'
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Cria Políticas Granulares
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('animes', 'cartoons', 'filmes', 'mangas', 'hqs', 'episodes', 'manga_volumes', 'hq_editions')
    LOOP
        -- LEITURA: Todos podem ver itens globais (user_id NULL) ou seus próprios itens
        EXECUTE format('CREATE POLICY %I_select_all ON %I FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id)', t, t);

        -- ESCRITA (USUÁRIO): Pode fazer tudo nos SEUS próprios itens (onde user_id coincide com seu UID)
        -- Importante: user_id deve ser preenchido no INSERT
        EXECUTE format('CREATE POLICY %I_user_write ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);

        -- ESCRITA (ADMIN): Pode gerenciar itens GLOBAIS (onde user_id é NULL)
        EXECUTE format('CREATE POLICY %I_admin_global_manage ON %I FOR ALL USING (user_id IS NULL AND is_admin()) WITH CHECK (user_id IS NULL AND is_admin())', t, t);
    END LOOP;
END $$;

-- 5. Garante que os registros globais existentes tenham user_id NULL
-- (Caso algum tenha sido salvo com string 'null' ou algo do tipo por erro de código)
UPDATE animes SET user_id = NULL WHERE user_id::text = 'null' OR user_id::text = '';
UPDATE cartoons SET user_id = NULL WHERE user_id::text = 'null' OR user_id::text = '';
UPDATE filmes SET user_id = NULL WHERE user_id::text = 'null' OR user_id::text = '';
UPDATE mangas SET user_id = NULL WHERE user_id::text = 'null' OR user_id::text = '';
UPDATE hqs SET user_id = NULL WHERE user_id::text = 'null' OR user_id::text = '';

-- FIM DO SCRIPT
