-- Habilita o Realtime do Supabase para a tabela de mensagens diretas
-- Execute este comando no SQL Editor do seu projeto Supabase

begin;
  -- Adiciona a tabela public.direct_messages a publicacao supabase_realtime
  alter publication supabase_realtime add table public.direct_messages;
commit;

select 'Realtime ativado com sucesso para direct_messages' as status;
