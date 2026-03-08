-- Script para adicionar colunas que faltam na tabela de compradores
ALTER TABLE public.interested_buyers 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';

-- Tabela de Autorizações de Visualização (Quais compradores podem ver quais leads)
CREATE TABLE IF NOT EXISTS public.buyer_authorizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.interested_buyers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads_veiculos(id) ON DELETE CASCADE,
  authorized_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(buyer_id, lead_id)
);

-- Adicionar campo de itens selecionados para o resumo do cliente
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS selected_items JSONB DEFAULT '[]'::jsonb;

-- Habilitar RLS para a nova tabela
ALTER TABLE public.buyer_authorizations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Admins podem fazer tudo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'buyer_authorizations' AND policyname = 'Admins can manage authorizations'
  ) THEN
    CREATE POLICY "Admins can manage authorizations" ON public.buyer_authorizations
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END
$$;

-- Atualizar o cache do schema
NOTIFY pgrst, 'reload schema';
