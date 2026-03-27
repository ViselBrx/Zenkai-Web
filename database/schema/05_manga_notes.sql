-- ==========================================
-- TABELA E PERMISSÕES: ANOTAÇÕES DE MANGÁS
-- ==========================================

-- 1. Cria a tabela manga_notes
CREATE TABLE IF NOT EXISTS public.manga_notes (
    id TEXT PRIMARY KEY,
    manga_id TEXT NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
    volume_id TEXT NOT NULL REFERENCES public.manga_volumes(id) ON DELETE CASCADE,
    note_text TEXT DEFAULT '',
    page_bookmark INTEGER DEFAULT NULL,
    updated_at BIGINT
);

ALTER TABLE public.manga_notes ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Segurança (RLS)
-- Permite leitura de notas por qualquer um (ou mude para ser só logado se preferir privacidade)
CREATE POLICY "Leitura Pública Manga Notes" ON public.manga_notes FOR SELECT USING (true);
-- Permite criar/editar/deletar notas apenas para logados
CREATE POLICY "Escrita Autenticada Manga Notes" ON public.manga_notes FOR ALL USING (auth.role() = 'authenticated');
