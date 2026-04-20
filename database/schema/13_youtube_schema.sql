-- 13_youtube_schema.sql
-- Adicionar suporte para YouTube Playlists e Videos

CREATE TABLE IF NOT EXISTS public.youtube_playlists (
    id text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text NOT NULL,
    capa text,
    created_at bigint NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    playlist_id text NOT NULL REFERENCES public.youtube_playlists(id) ON DELETE CASCADE,
    title text NOT NULL,
    iframe text,
    -- Ordem na playlist ou apenas registro cronológico
    created_at bigint NOT NULL,
    PRIMARY KEY (id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.youtube_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- Políticas para youtube_playlists
CREATE POLICY "Users can select their own youtube_playlists" 
    ON public.youtube_playlists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own youtube_playlists" 
    ON public.youtube_playlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube_playlists" 
    ON public.youtube_playlists FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube_playlists" 
    ON public.youtube_playlists FOR DELETE 
    USING (auth.uid() = user_id);

-- Políticas para youtube_videos
CREATE POLICY "Users can select their own youtube_videos" 
    ON public.youtube_videos FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own youtube_videos" 
    ON public.youtube_videos FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube_videos" 
    ON public.youtube_videos FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube_videos" 
    ON public.youtube_videos FOR DELETE 
    USING (auth.uid() = user_id);
