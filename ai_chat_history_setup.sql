-- Permanent IA chat history per user (Open AnIme)
-- Execute this in Supabase SQL Editor

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context text not null default 'chat',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.ai_chat_messages
  add column if not exists context text not null default 'chat';

alter table public.ai_chat_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ai_chat_messages
  drop constraint if exists ai_chat_messages_context_check;

alter table public.ai_chat_messages
  add constraint ai_chat_messages_context_check check (context in ('chat', 'compare', 'vision'));

create index if not exists idx_ai_chat_messages_user_created
  on public.ai_chat_messages(user_id, created_at asc);

create index if not exists idx_ai_chat_messages_user_context_created
  on public.ai_chat_messages(user_id, context, created_at asc);

alter table public.ai_chat_messages enable row level security;

drop policy if exists ai_chat_messages_select_own on public.ai_chat_messages;
create policy ai_chat_messages_select_own
  on public.ai_chat_messages
  for select
  using (auth.uid() = user_id);

drop policy if exists ai_chat_messages_insert_own on public.ai_chat_messages;
create policy ai_chat_messages_insert_own
  on public.ai_chat_messages
  for insert
  with check (auth.uid() = user_id);

drop policy if exists ai_chat_messages_update_own on public.ai_chat_messages;
create policy ai_chat_messages_update_own
  on public.ai_chat_messages
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists ai_chat_messages_delete_own on public.ai_chat_messages;
create policy ai_chat_messages_delete_own
  on public.ai_chat_messages
  for delete
  using (auth.uid() = user_id);
