-- Permanent watch history per user
-- Execute this in Supabase SQL Editor

create table if not exists public.user_watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  content_type text not null,
  title text not null,
  subtitle text,
  cover_url text,
  route text not null default 'index.html',
  payload jsonb not null default '{}'::jsonb,
  last_watched_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_user_watch_history_item
  on public.user_watch_history(user_id, content_id, content_type, route);

create index if not exists idx_user_watch_history_user_last
  on public.user_watch_history(user_id, last_watched_at desc);

alter table public.user_watch_history enable row level security;

drop policy if exists user_watch_history_select_own on public.user_watch_history;
create policy user_watch_history_select_own
  on public.user_watch_history
  for select
  using (auth.uid() = user_id);

drop policy if exists user_watch_history_insert_own on public.user_watch_history;
create policy user_watch_history_insert_own
  on public.user_watch_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists user_watch_history_update_own on public.user_watch_history;
create policy user_watch_history_update_own
  on public.user_watch_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_watch_history_delete_own on public.user_watch_history;
create policy user_watch_history_delete_own
  on public.user_watch_history
  for delete
  using (auth.uid() = user_id);
