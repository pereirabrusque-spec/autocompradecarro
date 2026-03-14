-- 1. Tabela de Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES public.profiles(id) NOT NULL,
  client_id uuid REFERENCES public.profiles(id) NOT NULL,
  vehicle_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  is_automated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Regras do Agente AI
CREATE TABLE IF NOT EXISTS public.ai_agent_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL UNIQUE, -- 'buyer', 'premium', 'master'
  negotiation_rules text NOT NULL,
  auto_interaction_template text NOT NULL
);

-- 4. Ajuste na tabela profiles para notificações
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_enabled boolean DEFAULT true;

-- Políticas de Segurança (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de Conversas
CREATE POLICY "Admins podem ver todas conversas" ON public.conversations FOR ALL USING (public.is_admin());
CREATE POLICY "Usuários podem ver suas conversas" ON public.conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = client_id);

-- Políticas de Mensagens
CREATE POLICY "Admins podem ver todas mensagens" ON public.messages FOR ALL USING (public.is_admin());
CREATE POLICY "Usuários podem ver mensagens de suas conversas" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (buyer_id = auth.uid() OR client_id = auth.uid())));
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (buyer_id = auth.uid() OR client_id = auth.uid())));
