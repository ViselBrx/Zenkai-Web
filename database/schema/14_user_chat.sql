-- Chat direto entre usuarios da comunidade.
-- Execute depois do schema de profiles.
-- Esta versao adiciona status de entrega/leitura e suporte a anexos.

create table if not exists public.direct_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text,
  delivered_at timestamptz,
  read_at timestamptz,
  hidden_for_sender_at timestamptz,
  hidden_for_recipient_at timestamptz,
  deleted_for_everyone_at timestamptz,
  attachment_url text,
  attachment_path text,
  attachment_name text,
  attachment_size_bytes bigint,
  attachment_mime_type text,
  attachment_kind text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint direct_messages_not_self check (sender_id <> recipient_id)
);

alter table public.direct_messages
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists hidden_for_sender_at timestamptz,
  add column if not exists hidden_for_recipient_at timestamptz,
  add column if not exists deleted_for_everyone_at timestamptz,
  add column if not exists attachment_url text,
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size_bytes bigint,
  add column if not exists attachment_mime_type text,
  add column if not exists attachment_kind text;

alter table public.direct_messages
  alter column content drop not null;

alter table public.direct_messages
  alter column content drop default;

alter table public.direct_messages
  drop constraint if exists direct_messages_content_len;

alter table public.direct_messages
  drop constraint if exists direct_messages_payload_check;

alter table public.direct_messages
  drop constraint if exists direct_messages_attachment_size_limit;

alter table public.direct_messages
  drop constraint if exists direct_messages_attachment_kind_check;

alter table public.direct_messages
  add constraint direct_messages_content_len
  check (
    content is null
    or char_length(btrim(content)) between 1 and 600
  );

alter table public.direct_messages
  add constraint direct_messages_payload_check
  check (
    (content is not null and char_length(btrim(content)) between 1 and 600)
    or attachment_url is not null
    or deleted_for_everyone_at is not null
  );

alter table public.direct_messages
  add constraint direct_messages_attachment_size_limit
  check (
    attachment_size_bytes is null
    or attachment_size_bytes between 1 and 52428800
  );

alter table public.direct_messages
  add constraint direct_messages_attachment_kind_check
  check (
    attachment_kind is null
    or attachment_kind in ('image', 'file')
  );

create index if not exists idx_direct_messages_sender_recipient_created
  on public.direct_messages(sender_id, recipient_id, created_at desc);

create index if not exists idx_direct_messages_recipient_read
  on public.direct_messages(recipient_id, read_at, created_at desc);

create index if not exists idx_direct_messages_recipient_delivered
  on public.direct_messages(recipient_id, delivered_at, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists direct_messages_select_participants on public.direct_messages;
create policy direct_messages_select_participants
  on public.direct_messages
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists direct_messages_insert_sender on public.direct_messages;
create policy direct_messages_insert_sender
  on public.direct_messages
  for insert
  with check (auth.uid() = sender_id and sender_id <> recipient_id);

drop policy if exists direct_messages_update_recipient on public.direct_messages;
drop policy if exists direct_messages_update_participants on public.direct_messages;
create policy direct_messages_update_participants
  on public.direct_messages
  for update
  using (auth.uid() = sender_id or auth.uid() = recipient_id)
  with check (auth.uid() = sender_id or auth.uid() = recipient_id);

grant select, insert, update on public.direct_messages to authenticated;
grant usage, select on sequence public.direct_messages_id_seq to authenticated;

select 'Tabela direct_messages pronta com anexos, status de envio e exclusao de mensagens.' as status;
