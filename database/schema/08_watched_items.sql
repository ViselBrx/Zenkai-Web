-- Checklist permanente por usuario
-- Execute este script no SQL Editor do Supabase

create table if not exists public.user_watched_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content_id text not null,
  content_type text not null default 'generic',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_user_watched_items_user_content
  on public.user_watched_items(user_id, content_id);

create index if not exists idx_user_watched_items_user_created
  on public.user_watched_items(user_id, created_at desc);

alter table public.user_watched_items enable row level security;

drop policy if exists user_watched_items_select_own on public.user_watched_items;
create policy user_watched_items_select_own
  on public.user_watched_items
  for select
  using (auth.uid() = user_id);

drop policy if exists user_watched_items_insert_own on public.user_watched_items;
create policy user_watched_items_insert_own
  on public.user_watched_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists user_watched_items_update_own on public.user_watched_items;
create policy user_watched_items_update_own
  on public.user_watched_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_watched_items_delete_own on public.user_watched_items;
create policy user_watched_items_delete_own
  on public.user_watched_items
  for delete
  using (auth.uid() = user_id);
