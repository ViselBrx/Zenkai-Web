-- ==========================================
-- STORAGE: BUCKET DE CAPAS DE DESENHOS/ANIMES
-- ==========================================
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/bxifddhrbxbmimjkgwzr/sql/new)
-- para criar o bucket onde as capas serão guardadas na nuvem.

-- 1. Cria o bucket 'capas' como público (para que qualquer visitante do site possa ver as imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'capas',
    'capas',
    true,
    5242880,  -- limite de 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que QUALQUER UM veja as capas (necessário para exibir no site)
CREATE POLICY "Capas são públicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'capas' );

-- 3. Permite que APENAS usuários logados façam upload de capas
CREATE POLICY "Usuários logados podem subir capas"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'capas' AND auth.role() = 'authenticated' );

-- 4. Permite que usuários logados apaguem capas (para atualização)
CREATE POLICY "Usuários logados podem deletar capas"
ON storage.objects FOR DELETE
USING ( bucket_id = 'capas' AND auth.role() = 'authenticated' );
