-- Table for FIPE discount rules
CREATE TABLE IF NOT EXISTS public.fipe_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condition_name TEXT NOT NULL UNIQUE, -- e.g. 'Financiado', 'Renajud'
    discount_percentage NUMERIC DEFAULT 0, -- e.g. 50 for 50% off FIPE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default rules requested
INSERT INTO public.fipe_rules (condition_name, discount_percentage) VALUES 
('Financiado', 50),
('Renajud', 20),
('Batido', 10),
('Cooperativa', 80),
('Nome Jurídico (Empresa)', 70),
('Motor Estragado (Quitado)', 80)
ON CONFLICT (condition_name) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage;
