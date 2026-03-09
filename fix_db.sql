-- 1. Ensure all columns exist in leads_veiculos
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS quilometragem NUMERIC;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS parcelas_atrasadas INTEGER DEFAULT 0;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 0;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS problemas TEXT[] DEFAULT '{}';
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}';
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS banco_financiamento TEXT;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER DEFAULT 0;
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS mileage NUMERIC;

-- 2. Ensure profiles table and columns exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 3. Ensure admin_users and interested_buyers exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interested_buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interested_buyers ENABLE ROW LEVEL SECURITY;

-- 5. Fix Policies (Avoiding Infinite Recursion)

-- PROFILES Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Non-recursive admin check for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );

-- ADMIN_USERS Policies (The tricky one)
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin entry" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can read admin list" ON public.admin_users;

-- Allow any authenticated user to read the admin list to check their own status
-- This is the simplest way to avoid recursion and is safe as it only contains emails
CREATE POLICY "Authenticated users can read admin list" ON public.admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- INTERESTED_BUYERS Policies
DROP POLICY IF EXISTS "Admins can view interested_buyers" ON public.interested_buyers;
DROP POLICY IF EXISTS "Users can view own buyer entry" ON public.interested_buyers;
DROP POLICY IF EXISTS "Admins can view all interested_buyers" ON public.interested_buyers;

CREATE POLICY "Admins can view all interested_buyers" ON public.interested_buyers
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );

-- LEADS_VEICULOS Policies
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads_veiculos;
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads_veiculos;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads_veiculos;

CREATE POLICY "Anyone can insert leads" ON public.leads_veiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own leads" ON public.leads_veiculos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all leads" ON public.leads_veiculos
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.jwt() ->> 'email')
    );
