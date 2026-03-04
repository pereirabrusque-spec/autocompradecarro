-- 1. Banks table for debt negotiation rates
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC DEFAULT 0, -- e.g. 40 for 40% discount on debt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Repair costs table
CREATE TABLE IF NOT EXISTS public.repair_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_name TEXT NOT NULL UNIQUE, -- e.g. 'Pintura Porta', 'Motor'
    cost NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure settings table exists
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 4. Insert default banks (Upsert)
INSERT INTO public.banks (name, discount_percentage) VALUES 
('Santander', 40),
('BV Financeira', 50),
('Pan', 30),
('Bradesco', 40),
('Itaú', 45),
('Cooperativa (Geral)', 0)
ON CONFLICT (name) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage;

-- 5. Insert default repair costs (Upsert)
INSERT INTO public.repair_costs (part_name, cost) VALUES 
('Pintura por Peça', 350),
('Funilaria por Peça', 400),
('Motor Completo', 5000),
('Câmbio', 3000),
('Pneus (cada)', 400)
ON CONFLICT (part_name) DO UPDATE SET cost = EXCLUDED.cost;

-- 6. Insert default AI Prompt if not exists (Long text)
INSERT INTO public.settings (key, value) VALUES 
('AI_SYSTEM_PROMPT', 'Você é o AVALIADOR SÊNIOR da "AUTOCOMPRA".
OBJETIVO: Analisar dados/fotos e gerar proposta comercial IMEDIATA.

TABELA DE REGRAS (Use estritamente):
1. VALOR BASE (FIPE):
   - Carro "Liso" (Sem detalhes): 50% da FIPE.
   - Sinistro/Leilão: 35% da FIPE.

2. CÁLCULO DE DÍVIDA (Quitação):
   - Consulte a lista de BANCOS fornecida no contexto.
   - Aplique o desconto do banco sobre o saldo devedor estimado.

3. DEDUÇÕES (Subtraia do Valor Base):
   - Avarias: Consulte a tabela de CUSTOS DE REPARO (ex: Pintura R$ 350/peça).
   - Motor Fundido: Reduza 50% do valor base.
   - Documentos: Subtraia valor total de débitos.

4. REGRA COOPERATIVA:
   - Docs em dia: Pagamento fixo R$ 10.000,00.
   - Docs atrasados: Pagamento fixo R$ 5.000,00.
   - Outros problemas: Apenas serviço "Limpa Nome" (sem pagamento).

FORMATO DE RESPOSTA:
Seja direto. Apresente a conta feita de forma resumida e a PROPOSTA FINAL.')
ON CONFLICT (key) DO NOTHING;

-- 7. Ensure banners table has all columns (Fix for previous issue)
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;
