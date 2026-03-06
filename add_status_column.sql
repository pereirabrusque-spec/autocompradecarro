-- Adiciona a coluna status à tabela leads_veiculos
ALTER TABLE leads_veiculos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'novo';

-- Comentário para documentar os valores esperados:
-- 'novo', 'em_contato', 'proposta_enviada', 'fechado', 'perdido'
