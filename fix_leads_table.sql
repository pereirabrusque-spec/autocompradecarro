-- Fix leads_veiculos table schema to match payload
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS parcelas_atrasadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS problemas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS banco_financiamento TEXT;
