-- =====================================================
-- MIGRATION: Adiciona a coluna 'user_id' nos catálogos
-- Objetivo: Permitir que o sistema filtre por usuário e 
-- evite erros de "coluna inexistente" no db.js.
-- =====================================================

-- 1. Desenhos
ALTER TABLE public.cartoons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;

-- 2. Animes
ALTER TABLE public.animes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;
ALTER TABLE public.anime_episodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;

-- 3. Mangás
ALTER TABLE public.mangas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;
ALTER TABLE public.manga_volumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;
ALTER TABLE public.manga_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;

-- 4. Filmes (Tabela mais recente)
ALTER TABLE public.filmes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;

-- 5. Configurações
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users DEFAULT NULL;

-- 6. Garantir que as políticas de RLS permitam a leitura global se user_id for null
-- (Isso garante que o catálogo original continue visível para todos)
DO $$ 
BEGIN
    -- Exemplo para animes (Repetir se necessário para outras tabelas)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura Pública Animes Nova') THEN
        CREATE POLICY "Leitura Pública Animes Nova" ON public.animes FOR SELECT USING (true);
    END IF;
END $$;

SELECT 'Migração concluída com sucesso! Agora o user_id existe em todas as tabelas de catálogo.' as status;
