-- 1. Tabela para armazenar as propostas e mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads_veiculos(id),
  sender_type TEXT CHECK (sender_type IN ('admin', 'cliente', 'system')),
  message TEXT NOT NULL,
  is_proposal BOOLEAN DEFAULT false,
  proposal_value DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela para controlar as permissões de notificação do cliente
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads_veiculos(id) UNIQUE,
  authorized_notifications BOOLEAN DEFAULT false,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela para armazenar a foto do atendente do chat
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Habilitar RLS (opcional, mas recomendado)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
