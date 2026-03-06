-- Função para gerar código alfanumérico aleatório de 4 caracteres
CREATE OR REPLACE FUNCTION generate_vehicle_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Adiciona a coluna vehicle_code se não existir
ALTER TABLE leads_veiculos ADD COLUMN IF NOT EXISTS vehicle_code TEXT UNIQUE;

-- Função do trigger para garantir que o código seja gerado se não fornecido
CREATE OR REPLACE FUNCTION trg_generate_vehicle_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vehicle_code IS NULL OR NEW.vehicle_code = '' THEN
    -- Tenta gerar um código único (loop simples para evitar colisões raras)
    LOOP
      NEW.vehicle_code := generate_vehicle_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM leads_veiculos WHERE vehicle_code = NEW.vehicle_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger
DROP TRIGGER IF EXISTS t_generate_vehicle_code ON leads_veiculos;
CREATE TRIGGER t_generate_vehicle_code
BEFORE INSERT ON leads_veiculos
FOR EACH ROW
EXECUTE FUNCTION trg_generate_vehicle_code();

-- Atualiza leads existentes que não possuem código (opcional)
UPDATE leads_veiculos SET vehicle_code = generate_vehicle_code() WHERE vehicle_code IS NULL;
