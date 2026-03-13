-- ============================================================================
-- SQL DE CORREÇÃO COMPLETA DO BANCO DE DATOS (VERSÃO V3 - COMPATIBILIDADE)
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ============================================================================

-- 1. TABELA DE BANCOS (BANKS)
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    is_cooperativa BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS is_cooperativa BOOLEAN DEFAULT false;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'banks_name_key') THEN
        ALTER TABLE public.banks ADD CONSTRAINT banks_name_key UNIQUE (name);
    END IF;
END $$;

-- 2. TABELA DE MENSAGENS INTERNAS (INTERNAL_MESSAGES)
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    lead_id UUID
);

-- 3. TABELA DE MENSAGENS DO CHAT (MENSAGENS)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    remetente TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE COMPRADORES INTERESSADOS (INTERESTED_BUYERS)
CREATE TABLE IF NOT EXISTS public.interested_buyers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interested_buyers_email_key') THEN
        ALTER TABLE public.interested_buyers ADD CONSTRAINT interested_buyers_email_key UNIQUE (email);
    END IF;
END $$;

-- 5. TABELA DE AUTORIZAÇÕES DE COMPRADORES (BUYER_AUTHORIZATIONS)
CREATE TABLE IF NOT EXISTS public.buyer_authorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.interested_buyers(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    show_photos BOOLEAN DEFAULT true,
    show_price BOOLEAN DEFAULT true,
    show_plate BOOLEAN DEFAULT false,
    show_details BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE LEADS ENVIADOS (SENT_LEADS)
CREATE TABLE IF NOT EXISTS public.sent_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    buyer_id UUID REFERENCES public.interested_buyers(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'sent'
);

-- 7. TABELA DE PROVEDORES DE AI (PROVIDERS)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_name_key') THEN
        ALTER TABLE public.providers ADD CONSTRAINT providers_name_key UNIQUE (name);
    END IF;
END $$;

-- 8. TABELA DE CHAVES DE API (API_KEYS)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    key_value TEXT NOT NULL,
    model_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. HABILITAR RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interested_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE ACESSO
DROP POLICY IF EXISTS "Public access banks" ON public.banks;
CREATE POLICY "Public access banks" ON public.banks FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view their own messages" ON public.internal_messages;
CREATE POLICY "Users can view their own messages" ON public.internal_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR receiver_id IS NULL);

DROP POLICY IF EXISTS "Users can insert messages" ON public.internal_messages;
CREATE POLICY "Users can insert messages" ON public.internal_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Public access mensagens" ON public.mensagens;
CREATE POLICY "Public access mensagens" ON public.mensagens FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access buyers" ON public.interested_buyers;
CREATE POLICY "Public access buyers" ON public.interested_buyers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access authorizations" ON public.buyer_authorizations;
CREATE POLICY "Public access authorizations" ON public.buyer_authorizations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access sent_leads" ON public.sent_leads;
CREATE POLICY "Public access sent_leads" ON public.sent_leads FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access providers" ON public.providers;
CREATE POLICY "Public access providers" ON public.providers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access api_keys" ON public.api_keys;
CREATE POLICY "Public access api_keys" ON public.api_keys FOR ALL USING (true);

-- 11. INSERIR DADOS INICIAIS COM TRATAMENTO PARA COLUNA 'SLUG' E 'NAME'
DO $$ 
BEGIN 
    -- Verifica se a coluna 'slug' existe na tabela 'providers'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'slug') THEN
        -- Inserção segura para Gemini
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'gemini' OR slug = 'gemini') THEN
            INSERT INTO public.providers (name, slug, is_active) VALUES ('gemini', 'gemini', true);
        END IF;
        
        -- Inserção segura para OpenAI
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'openai' OR slug = 'openai') THEN
            INSERT INTO public.providers (name, slug, is_active) VALUES ('openai', 'openai', false);
        END IF;
        
        -- Inserção segura para Anthropic
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'anthropic' OR slug = 'anthropic') THEN
            INSERT INTO public.providers (name, slug, is_active) VALUES ('anthropic', 'anthropic', false);
        END IF;
    ELSE
        -- Se não houver coluna slug, usa apenas o nome
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'gemini') THEN
            INSERT INTO public.providers (name, is_active) VALUES ('gemini', true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'openai') THEN
            INSERT INTO public.providers (name, is_active) VALUES ('openai', false);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE name = 'anthropic') THEN
            INSERT INTO public.providers (name, is_active) VALUES ('anthropic', false);
        END IF;
    END IF;
END $$;

-- Mensagem de sucesso
SELECT 'Banco de dados atualizado com sucesso!' as status;
