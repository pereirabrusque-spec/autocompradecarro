-- Add columns for rich text content in banners
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge_text TEXT;

-- Update existing hero banners with default text so they aren't empty
UPDATE public.banners 
SET 
  title = 'Transforme <span class="text-red-600">seu</span> <span class="text-white">problema</span> <span class="text-red-600">em</span> <span class="text-green-500">dinheiro</span> <span class="text-white">vivo</span> <span class="text-red-600">agora.</span>',
  subtitle = 'Especialistas em veículos com dívidas, financiamento atrasado, motor estourado ou batidos. Assumimos a burocracia e limpamos seu nome.',
  badge_text = 'SOLUÇÃO IMEDIATA'
WHERE tipo LIKE 'hero_bg%';
