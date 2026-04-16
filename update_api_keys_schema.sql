-- SQL para atualizar a tabela api_keys com colunas de diagnóstico
-- Copie e cole este código no SQL Editor do seu Supabase Dashboard

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status text DEFAULT 'disconnected';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used timestamp with time zone;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_test_at timestamp with time zone;

-- Grant permissions (necessário se usar RLS forte)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public api_keys access" ON api_keys;
CREATE POLICY "Public api_keys access" ON api_keys FOR ALL USING (true) WITH CHECK (true);
