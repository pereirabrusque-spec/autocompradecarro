-- ATUALIZAÇÃO DO BANCO DE DADOS PARA NOVAS FUNCIONALIDADES

-- 1. Adicionar código de identificação de 4 dígitos aos leads
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS vehicle_code TEXT UNIQUE;

-- 2. Tabela de Clientes Interessados (CRM)
CREATE TABLE IF NOT EXISTS public.interested_buyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL, -- 'carro', 'moto', 'caminhao'
  type TEXT NOT NULL,     -- 'popular', 'normal', 'premium'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Histórico de Envios
CREATE TABLE IF NOT EXISTS public.sent_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads_veiculos(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.interested_buyers(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(lead_id, buyer_id)
);

-- 4. Adicionar colunas de valores financeiros aos leads para persistência
ALTER TABLE public.leads_veiculos
ADD COLUMN IF NOT EXISTS fipe_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desired_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS suggested_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payoff_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS doc_debts NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS repair_debts NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC DEFAULT 0;

-- 5. Função para gerar código aleatório de 4 dígitos (letras e números)
CREATE OR REPLACE FUNCTION generate_vehicle_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para gerar código automaticamente se não fornecido
CREATE OR REPLACE FUNCTION trigger_generate_vehicle_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vehicle_code IS NULL THEN
    NEW.vehicle_code := generate_vehicle_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_vehicle_code ON public.leads_veiculos;
CREATE TRIGGER ensure_vehicle_code
BEFORE INSERT ON public.leads_veiculos
FOR EACH ROW EXECUTE PROCEDURE trigger_generate_vehicle_code();

-- 7. Habilitar RLS para as novas tabelas
ALTER TABLE public.interested_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on interested_buyers" ON public.interested_buyers
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on sent_leads" ON public.sent_leads
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
