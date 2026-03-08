-- Adicionar coluna user_id na tabela leads_veiculos para vincular ao login
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Permitir que usuários vejam mensagens onde eles são o lead
CREATE POLICY "Users can view messages for their leads" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads_veiculos 
      WHERE leads_veiculos.id = chat_messages.lead_id 
      AND leads_veiculos.user_id = auth.uid()
    )
  );

-- Atualizar o cache do schema
NOTIFY pgrst, 'reload schema';
