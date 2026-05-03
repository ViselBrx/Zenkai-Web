-- ============================================================
-- SCHEMA: HQs (Histórias em Quadrinhos / Graphic Novels)
-- Segue o mesmo padrão de mangas, manga_volumes e manga_notes
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela principal: hqs
CREATE TABLE IF NOT EXISTS public.hqs (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    capa TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at BIGINT
);

ALTER TABLE public.hqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Pública HQs" ON public.hqs FOR SELECT USING (true);
CREATE POLICY "Escrita Autenticada HQs" ON public.hqs FOR ALL USING (auth.role() = 'authenticated');

-- 2. Tabela de edições: hq_editions
CREATE TABLE IF NOT EXISTS public.hq_editions (
    id TEXT PRIMARY KEY,
    hq_id TEXT NOT NULL REFERENCES public.hqs(id) ON DELETE CASCADE,
    edition_number NUMERIC NOT NULL,
    title TEXT,
    pdf_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at BIGINT
);

ALTER TABLE public.hq_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Pública HQ Editions" ON public.hq_editions FOR SELECT USING (true);
CREATE POLICY "Escrita Autenticada HQ Editions" ON public.hq_editions FOR ALL USING (auth.role() = 'authenticated');

-- 3. Tabela de anotações: hq_notes
CREATE TABLE IF NOT EXISTS public.hq_notes (
    id TEXT PRIMARY KEY,
    hq_id TEXT NOT NULL REFERENCES public.hqs(id) ON DELETE CASCADE,
    edition_id TEXT NOT NULL REFERENCES public.hq_editions(id) ON DELETE CASCADE,
    note_text TEXT DEFAULT '',
    page_bookmark INTEGER DEFAULT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at BIGINT
);

ALTER TABLE public.hq_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Pública HQ Notes" ON public.hq_notes FOR SELECT USING (true);
CREATE POLICY "Escrita Autenticada HQ Notes" ON public.hq_notes FOR ALL USING (auth.role() = 'authenticated');

-- 4. Bucket de PDFs para HQs (reutiliza o bucket de mangás ou cria um separado)
-- Para criar um bucket exclusivo para HQs:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'hqs_pdfs',
    'hqs_pdfs',
    true,
    104857600,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Permissões do bucket hqs_pdfs
DROP POLICY IF EXISTS "PDFs de HQs são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem subir PDFs de HQs" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem deletar PDFs de HQs" ON storage.objects;

CREATE POLICY "PDFs de HQs são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hqs_pdfs' );

CREATE POLICY "Usuários logados podem subir PDFs de HQs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'hqs_pdfs' AND auth.role() = 'authenticated' );

CREATE POLICY "Usuários logados podem deletar PDFs de HQs"
ON storage.objects FOR DELETE
USING ( bucket_id = 'hqs_pdfs' AND auth.role() = 'authenticated' );
