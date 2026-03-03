
-- Add columns for button configuration in banners
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;

-- Insert default settings for Hero Timer and Footer/Social
INSERT INTO public.settings (key, value) VALUES 
('HERO_TIMER', '5000'),
('CONTACT_EMAIL', 'contato@autocompra.com.br'),
('CONTACT_PHONE', '(11) 99999-9999'),
('SOCIAL_INSTAGRAM', 'https://instagram.com'),
('SOCIAL_FACEBOOK', 'https://facebook.com'),
('FOOTER_TEXT', 'AutoCompra - Soluções em Veículos. Compramos seu carro com dívida, batido ou financiado.'),
('FOOTER_COPYRIGHT', '© 2024 AutoCompra. Todos os direitos reservados.')
ON CONFLICT (key) DO NOTHING;
