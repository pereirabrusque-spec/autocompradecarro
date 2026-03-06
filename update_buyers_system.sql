-- ATUALIZAÇÃO PARA SISTEMA DE COMPRADORES E PROPOSTAS AVANÇADAS

-- 1. Atualizar tabela de compradores interessados
ALTER TABLE public.interested_buyers 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS sub_category TEXT, -- Subcategorias de preferência (ex: SUV, Sedan, Diesel)
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente'; -- 'pendente', 'autorizado', 'bloqueado'

-- 2. Tabela de Autorizações de Visualização (Quais compradores podem ver quais leads)
CREATE TABLE IF NOT EXISTS public.buyer_authorizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.interested_buyers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads_veiculos(id) ON DELETE CASCADE,
  authorized_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(buyer_id, lead_id)
);

-- 3. Adicionar campo de itens selecionados para o resumo do cliente
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS selected_items JSONB DEFAULT '[]'::jsonb;

-- 4. Habilitar RLS para a nova tabela
ALTER TABLE public.buyer_authorizations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS
-- Admins podem fazer tudo
CREATE POLICY "Admins can manage authorizations" ON public.buyer_authorizations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Compradores podem ver suas próprias autorizações
CREATE POLICY "Buyers can view own authorizations" ON public.buyer_authorizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.interested_buyers 
      WHERE interested_buyers.id = buyer_authorizations.buyer_id 
      AND interested_buyers.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Política para compradores verem leads autorizados
CREATE POLICY "Buyers can view authorized leads" ON public.leads_veiculos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buyer_authorizations
      JOIN public.interested_buyers ON interested_buyers.id = buyer_authorizations.buyer_id
      WHERE buyer_authorizations.lead_id = leads_veiculos.id
      AND interested_buyers.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 6. Atualizar a tabela de perfis para aceitar o papel de 'buyer'
-- (O check de role pode precisar ser atualizado se existir)
DO $$
BEGIN
    -- Se houver uma constraint de check, podemos precisar removê-la e recriá-la
    -- Mas geralmente usamos apenas TEXT sem constraint rígida no schema inicial
    NULL;
END $$;
