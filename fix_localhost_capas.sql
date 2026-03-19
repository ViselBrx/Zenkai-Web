-- ==========================================
-- CORREÇÃO: Limpar URLs localhost de capas no Supabase
-- ==========================================
-- Execute no SQL Editor do Supabase para corrigir capas que estão com URL localhost (inacessíveis).
-- Isso vai apagar a URL quebrada (que era http://localhost:3000/uploads/...) 
-- e deixar o campo vazio, exibindo o placeholder no site.

-- Limpar capas com URL localhost em cartoons
UPDATE public.cartoons
SET capa = ''
WHERE capa LIKE 'http://localhost%';

-- Limpar capas com URL localhost em animes (caso existam)
UPDATE public.animes
SET capa = ''
WHERE capa LIKE 'http://localhost%';

-- Limpar capas com URL localhost em mangas (caso existam)
UPDATE public.mangas
SET capa = ''
WHERE capa LIKE 'http://localhost%';

-- Verificar o resultado (deve retornar 0 linhas com localhost)
SELECT id, nome, capa FROM public.cartoons WHERE capa LIKE 'http://localhost%';
SELECT id, nome, capa FROM public.animes WHERE capa LIKE 'http://localhost%';
