-- Adiciona a coluna is_ai_enabled na tabela profiles se ela não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;

-- Garante que a tabela settings existe e tem a estrutura correta
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
