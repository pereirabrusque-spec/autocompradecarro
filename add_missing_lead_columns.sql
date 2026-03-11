-- Add missing columns to leads_veiculos table
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS quilometragem INTEGER;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS placa TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS renavam TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS entrada NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS situacao_financeira TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS banco_financiamento TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS parcelas_atrasadas INTEGER;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS multas NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS motor_reparo NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS cambio_reparo NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS batido_reparo NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS avarias TEXT[];
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS avarias_manuais JSONB;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS selected_items TEXT[];
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS detalhes_proposta JSONB;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS vehicle_code TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS classificacao TEXT DEFAULT 'morna';

ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS problemas TEXT[];
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS fotos TEXT[];
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS videos TEXT[];
