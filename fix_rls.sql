-- Arquivo para corrigir o erro de permissão (RLS) no Supabase
-- Copie e cole este conteúdo no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela (se ainda não estiver)
ALTER TABLE leads_veiculos ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir inserção pública (anon)
-- Primeiro removemos a política se ela já existir para evitar duplicidade
DROP POLICY IF EXISTS "Permitir inserção pública" ON leads_veiculos;

CREATE POLICY "Permitir inserção pública"
ON leads_veiculos
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Criar política para permitir leitura pública (se necessário)
DROP POLICY IF EXISTS "Permitir leitura pública" ON leads_veiculos;

CREATE POLICY "Permitir leitura pública"
ON leads_veiculos
FOR SELECT
TO anon
USING (true);

-- 4. Garantir permissões básicas
GRANT ALL ON leads_veiculos TO anon;
GRANT ALL ON leads_veiculos TO authenticated;
GRANT ALL ON leads_veiculos TO service_role;
