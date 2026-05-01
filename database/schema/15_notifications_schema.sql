-- 15_notifications_schema.sql
-- Tabela de Notificações Unificada

DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null para notificações globais (opcional)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- 'chat', 'system', 'social', 'loja', 'medalha'
    link TEXT, -- Ex: 'usuarios.html?chat=UUID'
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Apenas o sistema/admin pode inserir notificações (usando service_role ou políticas específicas)
-- Para facilitar o desenvolvimento, permitiremos que usuários autenticados insiram se for necessário,
-- mas o ideal é via Trigger ou Funções.
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger para Mensagens de Chat (Direct Messages)
-- Sempre que uma mensagem for enviada, cria uma notificação para o destinatário
CREATE OR REPLACE FUNCTION public.handle_new_direct_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    -- Busca o username do remetente
    SELECT username INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        NEW.recipient_id,
        'Nova mensagem de ' || COALESCE(sender_name, 'Alguém'),
        CASE 
            WHEN NEW.content IS NOT NULL AND NEW.content <> '' THEN
                CASE 
                    WHEN length(NEW.content) > 50 THEN left(NEW.content, 47) || '...'
                    ELSE NEW.content
                END
            WHEN NEW.attachment_kind = 'image' THEN '📷 Enviou uma imagem'
            WHEN NEW.attachment_kind = 'file' THEN '📁 Enviou um arquivo: ' || COALESCE(NEW.attachment_name, 'anexo')
            ELSE 'Nova mensagem recebida'
        END,
        'chat',
        'usuarios.html?chat=' || NEW.sender_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar trigger à tabela direct_messages
-- Nota: Certifique-se que a tabela direct_messages existe (014_user_chat.sql)
DROP TRIGGER IF EXISTS on_direct_message_insert ON public.direct_messages;
CREATE TRIGGER on_direct_message_insert
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_direct_message();

-- Função para o Admin enviar alerta para TODOS os usuários
CREATE OR REPLACE FUNCTION public.send_global_notification(alert_title TEXT, alert_message TEXT)
RETURNS void AS $$
BEGIN
    -- SEGURANÇA: Apenas o e-mail autorizado pode disparar alertas globais
    IF (lower(auth.jwt() ->> 'email') != 'davizeravisel@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado. Apenas o administrador principal pode enviar alertas globais.';
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, alert_title, alert_message, 'system'
    FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
