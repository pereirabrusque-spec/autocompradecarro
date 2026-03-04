-- ============================================================================
-- 1. TABELA DE CONFIGURAÇÕES GERAIS (SETTINGS)
-- Armazena chaves de API, textos do site, links sociais, etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- ============================================================================
-- 2. TABELA DE BANNERS E CARDS (BANNERS)
-- Armazena o carrossel principal, cards de veículos e logos de parceiros.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'hero_bg', 'card_carro', 'partner_logo', etc.
    url TEXT NOT NULL,
    legenda TEXT,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Colunas adicionais para cards avançados
    title TEXT,
    subtitle TEXT,
    badge_text TEXT,
    button_text TEXT,
    button_link TEXT
);

-- Garante que as colunas existam caso a tabela já tenha sido criada antes
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;

-- ============================================================================
-- 3. TABELA DE BANCOS E DESCONTOS (BANKS)
-- Define a % de desconto que cada banco costuma dar na quitação de dívidas.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC DEFAULT 0, -- Ex: 40 para 40% de desconto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados padrão (Upsert)
INSERT INTO public.banks (name, discount_percentage) VALUES 
('Santander', 40),
('BV Financeira', 50),
('Pan', 30),
('Bradesco', 40),
('Itaú', 45),
('Cooperativa (Geral)', 0)
ON CONFLICT (name) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage;

-- ============================================================================
-- 4. TABELA DE CUSTOS DE REPARO (REPAIR_COSTS)
-- Define o custo médio de reparo por peça/serviço para abater da avaliação.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.repair_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_name TEXT NOT NULL UNIQUE, -- Ex: 'Pintura Porta', 'Motor'
    cost NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados padrão (Upsert)
INSERT INTO public.repair_costs (part_name, cost) VALUES 
('Pintura por Peça', 350),
('Funilaria por Peça', 400),
('Motor Completo', 5000),
('Câmbio', 3000),
('Pneus (cada)', 400)
ON CONFLICT (part_name) DO UPDATE SET cost = EXCLUDED.cost;

-- ============================================================================
-- 5. TABELA DE REGRAS DE DESCONTO FIPE (FIPE_RULES)
-- Define a % a ser descontada da FIPE baseada na situação do veículo.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fipe_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condition_name TEXT NOT NULL UNIQUE, -- Ex: 'Financiado', 'Renajud'
    discount_percentage NUMERIC DEFAULT 0, -- Ex: 50 para 50% de desconto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados padrão (Upsert)
INSERT INTO public.fipe_rules (condition_name, discount_percentage) VALUES 
('Financiado', 50),
('Renajud', 20),
('Batido', 10),
('Cooperativa', 80),
('Nome Jurídico (Empresa)', 70),
('Motor Estragado (Quitado)', 80)
ON CONFLICT (condition_name) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage;

-- ============================================================================
-- 6. PROMPT PADRÃO DA IA (CÉREBRO)
-- Define as regras de comportamento inicial da IA.
-- ============================================================================
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

-- ============================================================================
-- 7. TABELA DE LEADS (LEADS_VEICULOS)
-- Armazena os contatos gerados pelo site/chat.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads_veiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cliente_nome TEXT,
    email TEXT,
    telefone TEXT,
    marca TEXT,
    modelo TEXT,
    ano_modelo INTEGER,
    placa TEXT,
    renavam TEXT,
    cor TEXT,
    mileage NUMERIC,
    valor_fipe NUMERIC,
    preco_cliente NUMERIC,
    entrada NUMERIC,
    parcelas_pagas INTEGER,
    parcelas_restantes INTEGER,
    valor_parcela NUMERIC,
    banco_financiador TEXT,
    situacao_financeira TEXT,
    status TEXT DEFAULT 'novo',
    observacoes TEXT
);
