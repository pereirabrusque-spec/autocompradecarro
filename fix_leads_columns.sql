-- ATUALIZAÇÃO PARA GESTÃO DE PROPOSTAS E CLASSIFICAÇÃO
-- Copie e cole no SQL Editor do Supabase e clique em "Run".

-- 1. Adicionar colunas de classificação e detalhes da proposta
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS classificacao TEXT DEFAULT 'morna', -- quente, morna, fria
ADD COLUMN IF NOT EXISTS detalhes_proposta JSONB, -- Para salvar o cálculo detalhado (descontos aplicados)
ADD COLUMN IF NOT EXISTS valor_proposta_final NUMERIC, -- Valor final enviado
ADD COLUMN IF NOT EXISTS suggested_value NUMERIC,
ADD COLUMN IF NOT EXISTS fipe_value NUMERIC,
ADD COLUMN IF NOT EXISTS payoff_value NUMERIC,
ADD COLUMN IF NOT EXISTS doc_debts NUMERIC,
ADD COLUMN IF NOT EXISTS repair_debts NUMERIC,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC,
ADD COLUMN IF NOT EXISTS selected_items JSONB DEFAULT '[]'::jsonb;

-- 2. Garantir que status aceite os novos valores
ALTER TABLE public.leads_veiculos 
ALTER COLUMN status SET DEFAULT 'novo';

-- 3. Criar índices para performance nos filtros
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads_veiculos(status);
CREATE INDEX IF NOT EXISTS idx_leads_classificacao ON public.leads_veiculos(classificacao);

SELECT 'Estrutura de propostas atualizada com sucesso!' as status;
