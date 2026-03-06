-- Fix leads_veiculos schema for proposal saving
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS suggested_value NUMERIC,
ADD COLUMN IF NOT EXISTS fipe_value NUMERIC,
ADD COLUMN IF NOT EXISTS payoff_value NUMERIC,
ADD COLUMN IF NOT EXISTS doc_debts NUMERIC,
ADD COLUMN IF NOT EXISTS repair_debts NUMERIC,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC,
ADD COLUMN IF NOT EXISTS selected_items JSONB DEFAULT '[]'::jsonb;
