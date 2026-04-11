-- Fix RLS policies for leads_veiculos to allow updates
ALTER TABLE public.leads_veiculos ENABLE ROW LEVEL SECURITY;

-- 1. SELECT policies
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads_veiculos;
CREATE POLICY "Users can view own leads" ON public.leads_veiculos 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads_veiculos;
CREATE POLICY "Admins can view all leads" ON public.leads_veiculos
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );

-- 2. UPDATE policies (CRITICAL: This was missing or incomplete)
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads_veiculos;
CREATE POLICY "Users can update own leads" ON public.leads_veiculos 
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads_veiculos;
CREATE POLICY "Admins can update all leads" ON public.leads_veiculos
    FOR UPDATE USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );

-- 3. INSERT policies
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads_veiculos;
CREATE POLICY "Anyone can insert leads" ON public.leads_veiculos 
    FOR INSERT WITH CHECK (true);

-- 4. DELETE policies
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads_veiculos;
CREATE POLICY "Admins can delete leads" ON public.leads_veiculos
    FOR DELETE USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );

GRANT ALL ON public.leads_veiculos TO anon, authenticated, service_role;
