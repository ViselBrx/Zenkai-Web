-- ==========================================
-- STORAGE: BUCKET DE ANEXOS DO CHAT
-- ==========================================
-- Permite enviar fotos e arquivos de ate 50 MB para o chat.

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'chat-attachments',
  'chat-attachments',
  true,
  52428800
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Anexos do chat sao publicos" on storage.objects;
create policy "Anexos do chat sao publicos"
on storage.objects for select
using (bucket_id = 'chat-attachments');

drop policy if exists "Usuarios logados podem subir anexos do chat" on storage.objects;
create policy "Usuarios logados podem subir anexos do chat"
on storage.objects for insert
with check (bucket_id = 'chat-attachments' and auth.role() = 'authenticated');

drop policy if exists "Usuarios podem gerenciar os proprios anexos do chat" on storage.objects;
create policy "Usuarios podem gerenciar os proprios anexos do chat"
on storage.objects for all
using (bucket_id = 'chat-attachments' and auth.uid() = owner)
with check (bucket_id = 'chat-attachments' and auth.uid() = owner);
