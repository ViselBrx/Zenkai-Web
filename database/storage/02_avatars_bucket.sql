-- ==========================================
-- STORAGE: BUCKET DE AVATARES
-- ==========================================

-- 1. Cria o bucket para guardar as fotos (marcado como público para o link funcionar direto)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que QUALQUER UM veja as fotos de perfil
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Permite que APENAS usuários logados enviem fotos
CREATE POLICY "Usuários logados podem subir fotos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Permite que o usuário apague ou mude a própria foto
CREATE POLICY "Usuários podem gerenciar suas próprias fotos"
ON storage.objects FOR ALL
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );
