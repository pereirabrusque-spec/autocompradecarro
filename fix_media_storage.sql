-- VERIFICAÇÃO E CORREÇÃO DE MÍDIA (FOTOS/VÍDEOS)
-- Este script garante que o Bucket de Storage e as colunas do banco existam.
-- Copie e cole no SQL Editor do Supabase e clique em "Run".

-- 1. Garantir que as colunas existem na tabela de leads
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS fotos TEXT[],
ADD COLUMN IF NOT EXISTS videos TEXT[];

-- 2. Garantir que o Bucket 'veiculos' existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('veiculos', 'veiculos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Remover políticas antigas de storage para evitar conflitos
DROP POLICY IF EXISTS "Permitir upload público de veiculos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de veiculos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;

-- 4. Criar políticas permissivas para o bucket 'veiculos'
-- Permitir Upload (Inserção) para qualquer pessoa (anon e authenticated)
CREATE POLICY "Permitir upload público de veiculos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'veiculos');

-- Permitir Leitura (Select) para qualquer pessoa
CREATE POLICY "Permitir leitura pública de veiculos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'veiculos');

-- Permitir Atualização (Update) - opcional, mas útil
CREATE POLICY "Permitir atualização pública de veiculos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'veiculos');

-- Permitir Deleção (Delete) - opcional
CREATE POLICY "Permitir deleção pública de veiculos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'veiculos');

-- 5. Diagnóstico
SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads_veiculos' AND column_name = 'fotos') as coluna_fotos_existe,
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'veiculos') as bucket_veiculos_existe;
