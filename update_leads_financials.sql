-- Update leads_veiculos with financial details
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS banco_financiamento TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;
