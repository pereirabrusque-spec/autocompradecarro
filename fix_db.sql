-- Fix leads_veiculos table
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

-- Ensure mileage column exists (if used elsewhere)
ALTER TABLE public.leads_veiculos ADD COLUMN IF NOT EXISTS mileage NUMERIC;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fix profiles table policies to avoid infinite recursion
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create clean policies
-- 1. Everyone can see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Admins can view all profiles (using a non-recursive check)
-- We use a subquery to admin_users instead of profiles to avoid recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        ) OR (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com')
    );

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interested_buyers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.interested_buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled on these tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interested_buyers ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users and interested_buyers
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Admins can view interested_buyers" ON public.interested_buyers;
CREATE POLICY "Admins can view interested_buyers" ON public.interested_buyers
    FOR SELECT USING (
        (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com') OR
        EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.jwt() ->> 'email')
    );

-- Policy for leads_veiculos: Anyone can insert (for the form)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads_veiculos;
CREATE POLICY "Anyone can insert leads" ON public.leads_veiculos
    FOR INSERT WITH CHECK (true);

-- Policy for leads_veiculos: Users can see their own leads
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads_veiculos;
CREATE POLICY "Users can view own leads" ON public.leads_veiculos
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for leads_veiculos: Admins can see all leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads_veiculos;
CREATE POLICY "Admins can view all leads" ON public.leads_veiculos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        ) OR (auth.jwt() ->> 'email' = 'pereira.brusque@gmail.com')
    );
