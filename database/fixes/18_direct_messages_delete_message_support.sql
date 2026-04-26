-- Corrige a exclusao de mensagens no chat.
-- Execute este arquivo se o chat ja existir em producao.

alter table public.direct_messages
  add column if not exists hidden_for_sender_at timestamptz,
  add column if not exists hidden_for_recipient_at timestamptz,
  add column if not exists deleted_for_everyone_at timestamptz;

alter table public.direct_messages
  drop constraint if exists direct_messages_payload_check;

alter table public.direct_messages
  add constraint direct_messages_payload_check
  check (
    (content is not null and char_length(btrim(content)) between 1 and 600)
    or attachment_url is not null
    or deleted_for_everyone_at is not null
  );

drop policy if exists direct_messages_update_recipient on public.direct_messages;
drop policy if exists direct_messages_update_participants on public.direct_messages;

create policy direct_messages_update_participants
  on public.direct_messages
  for update
  using (auth.uid() = sender_id or auth.uid() = recipient_id)
  with check (auth.uid() = sender_id or auth.uid() = recipient_id);

grant update on public.direct_messages to authenticated;

select 'Correcoes de exclusao do chat aplicadas.' as status;
