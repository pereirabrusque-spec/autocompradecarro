CREATE TABLE IF NOT EXISTS public.repair_multipliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    min_value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL,
    multiplier NUMERIC NOT NULL
);

-- Insert default values
INSERT INTO public.repair_multipliers (min_value, max_value, multiplier) VALUES
(0, 20000, 1),
(20001, 60000, 2),
(60001, 100000, 3)
ON CONFLICT DO NOTHING;
