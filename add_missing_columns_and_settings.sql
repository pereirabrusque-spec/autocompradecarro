-- Adiciona colunas que o sistema envia mas que podem estar faltando no banco
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS suggested_value NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS data_negociacao TIMESTAMP WITH TIME ZONE;

-- Configurações para o modo de resposta (Chat vs Webhook)
INSERT INTO public.settings (key, value) VALUES 
('RESPONSE_MODE', 'chat'), -- 'chat' ou 'webhook'
('WEBHOOK_URL', '')
ON CONFLICT (key) DO NOTHING;

-- Garante que a IA esteja habilitada por padrão se não houver configuração
INSERT INTO public.settings (key, value) VALUES 
('AI_CRM_ENABLED', 'true')
ON CONFLICT (key) DO NOTHING;
