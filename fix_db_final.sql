-- 1. Ensure all columns exist in banners table
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;

-- 2. Insert default settings for new social media if they don't exist
INSERT INTO public.settings (key, value) VALUES 
('SOCIAL_YOUTUBE', ''),
('SOCIAL_TIKTOK', ''),
('SOCIAL_LINKEDIN', '')
ON CONFLICT (key) DO NOTHING;

-- 3. Ensure partner_logo type exists or clean up if needed
-- (No specific action needed, just ensuring the table is ready)
