-- Add faz_procuracao column to leads_veiculos table
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS faz_procuracao BOOLEAN DEFAULT false;

-- Update existing leads to have false if null
UPDATE public.leads_veiculos SET faz_procuracao = false WHERE faz_procuracao IS NULL;
