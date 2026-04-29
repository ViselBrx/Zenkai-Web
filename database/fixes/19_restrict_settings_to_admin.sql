-- Restringe alteracoes da tabela settings para o admin principal.
-- Mantem leitura publica para que os avisos temporarios aparecam no site todo.

alter table public.settings enable row level security;

drop policy if exists "Leitura Pública Settings" on public.settings;
drop policy if exists "Escrita Autenticada Settings" on public.settings;
drop policy if exists "Allow public read access to settings" on public.settings;
drop policy if exists "Allow admin to update aiConfig" on public.settings;

create policy "Allow public read access to settings"
on public.settings
for select
using (true);

create policy "Allow admin to manage settings"
on public.settings
for all
using (lower(auth.jwt() ->> 'email') = 'davizeravisel@gmail.com')
with check (lower(auth.jwt() ->> 'email') = 'davizeravisel@gmail.com');

grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
