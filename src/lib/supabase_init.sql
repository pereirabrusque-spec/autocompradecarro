-- 1. Adicionar coluna notifications_enabled se não existir na tabela interested_buyers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='interested_buyers' AND column_name='notifications_enabled') THEN
        ALTER TABLE public.interested_buyers ADD COLUMN notifications_enabled BOOLEAN DEFAULT NULL;
    END IF;
END
$$;

-- 2. Garantir que a tabela internal_messages tenha as colunas necessárias (caso o erro 400 persista por falta de campos)
-- Nota: O erro 400 pode ocorrer se a query estiver tentando filtrar por uma coluna que não existe.
-- Verifique se sender_id e receiver_id existem na tabela internal_messages.
