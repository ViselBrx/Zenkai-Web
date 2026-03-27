-- ==========================================
-- TABELA E STORAGE: VOLUMES DE MANGÁS (PDF)
-- ==========================================

-- 1. Cria a tabela para organizar os volumes dentro dos mangás
CREATE TABLE IF NOT EXISTS public.manga_volumes (
    id TEXT PRIMARY KEY,
    manga_id TEXT NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
    volume_number NUMERIC NOT NULL,
    title TEXT,
    pdf_url TEXT NOT NULL,
    created_at BIGINT
);

ALTER TABLE public.manga_volumes ENABLE ROW LEVEL SECURITY;

-- Permissões da tabela manga_volumes
CREATE POLICY "Leitura Pública Manga Volumes" ON public.manga_volumes FOR SELECT USING (true);
CREATE POLICY "Escrita Autenticada Manga Volumes" ON public.manga_volumes FOR ALL USING (auth.role() = 'authenticated');


-- 2. Cria o bucket 'mangas_pdfs' para guardar os arquivos PDF
-- Limite de ~100MB por PDF (104857600 bytes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mangas_pdfs',
    'mangas_pdfs',
    true,
    104857600,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Permissões do Bucket
-- Remove policies se existirem (para não dar erro de duplicado)
DROP POLICY IF EXISTS "PDFs de mangás são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem subir PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem deletar PDFs" ON storage.objects;

-- Permite leitura de PDF por qualquer um
CREATE POLICY "PDFs de mangás são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'mangas_pdfs' );

-- Permite upload apenas para logados
CREATE POLICY "Usuários logados podem subir PDFs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'mangas_pdfs' AND auth.role() = 'authenticated' );

-- Permite deletar/editar apenas para logados
CREATE POLICY "Usuários logados podem deletar PDFs"
ON storage.objects FOR DELETE
USING ( bucket_id = 'mangas_pdfs' AND auth.role() = 'authenticated' );
