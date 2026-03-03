-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: leads_veiculos
CREATE TABLE IF NOT EXISTS public.leads_veiculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    marca TEXT,
    modelo TEXT,
    ano_modelo TEXT,
    cor TEXT,
    placa TEXT,
    renavam TEXT,
    km INTEGER,
    valor_fipe NUMERIC,
    preco_cliente NUMERIC,
    cliente_nome TEXT,
    email TEXT,
    telefone TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'novo',
    situacao_financeira TEXT,
    entrada NUMERIC DEFAULT 0
);

-- 2. Table: banners
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    url TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'hero_bg', 'card_img', 'partner_logo', etc.
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    legenda TEXT,
    button_text TEXT,
    button_link TEXT,
    CONSTRAINT banners_tipo_check CHECK (char_length(tipo) > 0)
);

-- Add columns if they don't exist (for updates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banners' AND column_name = 'button_text') THEN
        ALTER TABLE public.banners ADD COLUMN button_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banners' AND column_name = 'button_link') THEN
        ALTER TABLE public.banners ADD COLUMN button_link TEXT;
    END IF;
END $$;

-- 3. Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Insert Default Settings
INSERT INTO public.settings (key, value) VALUES 
('GEMINI_API_KEY', ''),
('WHATSAPP_NUMBER', ''),
('WHATSAPP_BUTTON_TEXT', 'Falar com Especialista'),
('WHATSAPP_ENABLED', 'false'),
('HERO_TIMER', '5000'),
('CONTACT_EMAIL', 'contato@autocompra.com.br'),
('CONTACT_PHONE', '(11) 99999-9999'),
('SOCIAL_INSTAGRAM', 'https://instagram.com'),
('SOCIAL_FACEBOOK', 'https://facebook.com'),
('FOOTER_TEXT', 'Compramos seu carro com a melhor avaliação do mercado. Pagamento rápido e seguro.'),
('FOOTER_COPYRIGHT', '© 2026 AutoCompra. Todos os direitos reservados.')
ON CONFLICT (key) DO NOTHING;

-- 6. Insert Default Admin User (Replace with your email if needed)
INSERT INTO public.admin_users (email) VALUES 
('pereira.brusque@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 7. Insert Default Banners (if empty)
-- Hero Slides
INSERT INTO public.banners (tipo, url, legenda, ordem, button_text, button_link)
SELECT 'hero_bg_1', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1920', 'Vistoria Cautelar', 1, 'QUERO MINHA PROPOSTA', '/vender'
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE tipo = 'hero_bg_1');

INSERT INTO public.banners (tipo, url, legenda, ordem, button_text, button_link)
SELECT 'hero_bg_2', 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=1920', 'Caminhões e Pesados', 2, 'AVALIAR MEU CAMINHÃO', '/vender'
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE tipo = 'hero_bg_2');

-- 8. RLS Policies (Row Level Security)
-- Enable RLS
ALTER TABLE public.leads_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for leads_veiculos
CREATE POLICY "Public can insert leads" ON public.leads_veiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view leads" ON public.leads_veiculos FOR SELECT USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email')
);
CREATE POLICY "Admins can update leads" ON public.leads_veiculos FOR UPDATE USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email')
);

-- Policies for banners
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email')
);

-- Policies for settings
CREATE POLICY "Public can view public settings" ON public.settings FOR SELECT USING (
    key IN ('WHATSAPP_NUMBER', 'WHATSAPP_BUTTON_TEXT', 'WHATSAPP_ENABLED', 'HERO_TIMER', 'FOOTER_TEXT', 'FOOTER_COPYRIGHT', 'CONTACT_EMAIL', 'CONTACT_PHONE', 'SOCIAL_INSTAGRAM', 'SOCIAL_FACEBOOK')
);
CREATE POLICY "Admins can manage all settings" ON public.settings FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email')
);

-- Policies for admin_users
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email')
);
