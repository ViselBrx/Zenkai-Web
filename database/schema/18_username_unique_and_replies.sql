-- 1. Adiciona a coluna de reply em direct_messages
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS reply_to_id BIGINT REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- 2. Garante que username seja unico em profiles
-- (OBS: Se a query falhar aqui porque já existem nomes duplicados,
-- será necessário limpar os duplicados manualmente primeiro).
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_key UNIQUE (username);

SELECT 'Esquema atualizado com sucesso! reply_to_id adicionado e username agora é único.' as status;
