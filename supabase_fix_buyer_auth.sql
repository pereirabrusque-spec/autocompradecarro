
-- Create buyer_authorizations table if not exists
CREATE TABLE IF NOT EXISTS public.buyer_authorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lead_id UUID REFERENCES public.leads_veiculos(id), -- NULL means global/default permissions
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.buyer_authorizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage buyer authorizations" ON public.buyer_authorizations;
DROP POLICY IF EXISTS "Users can view their own authorizations" ON public.buyer_authorizations;

-- Create policies
CREATE POLICY "Admins can manage buyer authorizations" ON public.buyer_authorizations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can view their own authorizations" ON public.buyer_authorizations
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Add updated_at trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_buyer_authorizations_updated_at') THEN
        CREATE TRIGGER update_buyer_authorizations_updated_at
            BEFORE UPDATE ON public.buyer_authorizations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Ensure api_keys has status column
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ok';

-- Ensure repair_costs table exists and has conditions column
CREATE TABLE IF NOT EXISTS public.repair_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_name TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    conditions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conditions column if it doesn't exist (for existing tables)
ALTER TABLE public.repair_costs ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;
