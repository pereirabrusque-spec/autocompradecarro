-- Add conditions to repair_costs
ALTER TABLE public.repair_costs ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;

-- Add tags to settings
INSERT INTO public.settings (key, value) VALUES ('GOOGLE_ANALYTICS_ID', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('GOOGLE_ADS_ID', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('GOOGLE_ADS_CONVERSION_LABEL', '') ON CONFLICT (key) DO NOTHING;
