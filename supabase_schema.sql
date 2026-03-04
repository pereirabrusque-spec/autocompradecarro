-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Settings Table (Configurações do Site)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Banners & Assets Table (Hero, Cards, Footer Logos)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'hero_bg', 'card_carro', 'partner_logo'
    url TEXT NOT NULL,
    legenda TEXT, -- Alt text or title
    ordem INTEGER DEFAULT 0,
    button_text TEXT,
    button_link TEXT,
    title TEXT, -- HTML allowed for Hero
    subtitle TEXT,
    badge_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Leads Table (Formulário de Venda e Chat)
CREATE TABLE IF NOT EXISTS public.leads_veiculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_nome TEXT,
    email TEXT,
    telefone TEXT,
    marca TEXT,
    modelo TEXT,
    ano_modelo INTEGER,
    placa TEXT,
    renavam TEXT,
    quilometragem INTEGER,
    preco_cliente NUMERIC, -- Valor pedido pelo cliente
    valor_fipe NUMERIC,
    situacao_financeira TEXT, -- 'Quitado', 'Financiado', etc.
    entrada NUMERIC, -- Valor de entrada pago
    banco_financiador TEXT,
    valor_parcela NUMERIC,
    parcelas_pagas INTEGER,
    parcelas_restantes INTEGER,
    status TEXT DEFAULT 'novo', -- 'novo', 'em_analise', 'proposta_enviada'
    observacoes TEXT,
    origem TEXT DEFAULT 'site', -- 'site', 'chat', 'whatsapp'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. FIPE Rules Table (Regras de Desconto da IA)
CREATE TABLE IF NOT EXISTS public.fipe_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    condition_name TEXT UNIQUE NOT NULL, -- e.g. 'Financiado', 'Renajud'
    discount_percentage NUMERIC DEFAULT 0, -- % de desconto sobre a FIPE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Repair Costs Table (Custos de Reparo da IA)
CREATE TABLE IF NOT EXISTS public.repair_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    part_name TEXT UNIQUE NOT NULL, -- e.g. 'Pintura Porta', 'Motor'
    cost_value NUMERIC DEFAULT 0, -- Valor em R$
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Banks Table (Regras de Quitação Bancária)
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- e.g. 'Santander', 'BV'
    payoff_discount_percentage NUMERIC DEFAULT 0, -- % de desconto para quitação
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Admin Users Table (Acesso ao Painel)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Data

-- Default FIPE Rules
INSERT INTO public.fipe_rules (condition_name, discount_percentage) VALUES 
('Financiado', 50),
('Renajud', 20),
('Batido', 10),
('Cooperativa', 80),
('Nome Jurídico (Empresa)', 70),
('Motor Estragado (Quitado)', 80)
ON CONFLICT (condition_name) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage;

-- Default Repair Costs
INSERT INTO public.repair_costs (part_name, cost_value) VALUES 
('Pintura Porta', 350),
('Pintura Capô', 500),
('Pintura Teto', 600),
('Motor Completo', 5000),
('Câmbio', 3000),
('Farol', 800),
('Para-choque', 600)
ON CONFLICT (part_name) DO UPDATE SET cost_value = EXCLUDED.cost_value;

-- Default Banks
INSERT INTO public.banks (name, payoff_discount_percentage) VALUES 
('Santander', 40),
('BV Financeira', 35),
('Bradesco', 30),
('Itaú', 30),
('Pan', 45),
('Safra', 25)
ON CONFLICT (name) DO UPDATE SET payoff_discount_percentage = EXCLUDED.payoff_discount_percentage;

-- Default Admin User (Replace with your email)
INSERT INTO public.admin_users (email) VALUES ('admin@autocompra.com') ON CONFLICT DO NOTHING;

-- Storage Bucket Policy (Run this in SQL Editor if bucket doesn't exist, though usually done via UI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT DO NOTHING;
