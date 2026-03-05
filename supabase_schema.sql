-- Criação da tabela leads_veiculos se não existir
CREATE TABLE IF NOT EXISTS leads_veiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cliente_nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  marca TEXT,
  modelo TEXT,
  ano_modelo TEXT,
  cor TEXT,
  quilometragem NUMERIC, -- Padronizado como quilometragem
  placa TEXT,
  renavam TEXT,
  valor_fipe NUMERIC,
  preco_cliente NUMERIC,
  status TEXT DEFAULT 'novo', -- novo, morno, quente, fechado, perdido
  observacoes TEXT,
  entrada NUMERIC,
  situacao_financeira TEXT,
  problemas TEXT[], -- Array de strings para os problemas
  notifications_enabled BOOLEAN DEFAULT FALSE, -- Padronizado com ChatAssistant
  origem TEXT DEFAULT 'site' -- site, chat, whatsapp
);

-- Adicionar colunas caso não existam (para tabelas já criadas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads_veiculos' AND column_name = 'quilometragem') THEN
        ALTER TABLE leads_veiculos ADD COLUMN quilometragem NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads_veiculos' AND column_name = 'problemas') THEN
        ALTER TABLE leads_veiculos ADD COLUMN problemas TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads_veiculos' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE leads_veiculos ADD COLUMN notifications_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads_veiculos' AND column_name = 'situacao_financeira') THEN
        ALTER TABLE leads_veiculos ADD COLUMN situacao_financeira TEXT;
    END IF;
END $$;
