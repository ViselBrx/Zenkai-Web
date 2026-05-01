-- 19_fix_notification_empty_content.sql
-- Corrige o erro de constraint NOT NULL na tabela notifications quando uma mensagem de chat é enviada apenas com anexo.

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

-- Nota: Não é necessário recriar o trigger, apenas a função que ele chama.
SELECT 'Função handle_new_direct_message atualizada para suportar mensagens sem texto (apenas anexo).' as status;
