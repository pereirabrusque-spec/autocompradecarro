-- SQL para corrigir a tabela leads_veiculos e adicionar todas as colunas faltantes
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER,
ADD COLUMN IF NOT EXISTS tipo_veiculo TEXT,
ADD COLUMN IF NOT EXISTS tem_sinistro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passagem_leilao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fipe_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desired_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS suggested_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payoff_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS doc_debts NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS repair_debts NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS quilometragem INTEGER,
ADD COLUMN IF NOT EXISTS placa TEXT,
ADD COLUMN IF NOT EXISTS renavam TEXT,
ADD COLUMN IF NOT EXISTS cor TEXT,
ADD COLUMN IF NOT EXISTS detalhes_proposta JSONB,
ADD COLUMN IF NOT EXISTS selected_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS avarias_manuais TEXT,
ADD COLUMN IF NOT EXISTS vehicle_code TEXT;

-- Garantir que as colunas de fotos e vídeos existam como arrays de texto
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}';
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS problemas TEXT[] DEFAULT '{}';
