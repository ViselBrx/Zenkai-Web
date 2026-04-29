-- Fix para permitir que o Admin envie notificações globais
-- Abre a leitura dos perfis para usuários autenticados (necessário para listar destinatários)

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Garante que a função send_global_notification ignore RLS se necessário
-- (Embora SECURITY DEFINER já deva ajudar se criada pelo postgres)
ALTER FUNCTION public.send_global_notification(TEXT, TEXT) SECURITY DEFINER;
