-- 1. Adicionar colunas que faltam (button_text e button_link)
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;

-- 2. Garantir que a coluna 'tipo' seja única (necessário para o ON CONFLICT funcionar)
-- Primeiro, remove duplicatas se houver (mantendo o mais recente)
DELETE FROM public.banners a USING public.banners b
WHERE a.id < b.id AND a.tipo = b.tipo;

-- Depois adiciona a restrição UNIQUE se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'banners_tipo_key') THEN
    ALTER TABLE public.banners ADD CONSTRAINT banners_tipo_key UNIQUE (tipo);
  END IF;
END $$;

-- 3. Inserir ou Atualizar os Banners do Carrossel
INSERT INTO public.banners (tipo, url, legenda, ordem, button_text, button_link) VALUES
('hero_bg_1', 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1920', 'Vistoria Cautelar', 1, 'QUERO MINHA PROPOSTA', '/vender'),
('hero_bg_2', 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=1920', 'Caminhões e Pesados', 2, 'AVALIAR MEU CAMINHÃO', '/vender')
ON CONFLICT (tipo) DO UPDATE SET 
    button_text = EXCLUDED.button_text,
    button_link = EXCLUDED.button_link,
    url = EXCLUDED.url;
