-- 1. Remover políticas existentes para internal_messages
DROP POLICY IF EXISTS "Users can read own messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.internal_messages;

-- 2. Recriar políticas para internal_messages
-- Permite que o usuário leia mensagens onde ele é remetente ou destinatário
-- Permite que admins e vendedores leiam todas as mensagens (incluindo as enviadas para o admin com receiver_id = NULL)
CREATE POLICY "Users can read own messages" ON public.internal_messages
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  (auth.jwt() ->> 'role' = 'admin') OR
  (auth.jwt() ->> 'role' = 'seller')
);

-- Permite que o usuário insira mensagens como remetente
CREATE POLICY "Users can insert messages" ON public.internal_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);
