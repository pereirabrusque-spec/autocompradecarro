-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."profiles";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";

-- Create new policies without recursion
CREATE POLICY "Public profiles are viewable by everyone" 
ON "public"."profiles" FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON "public"."profiles" FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON "public"."profiles" FOR UPDATE 
USING (auth.uid() = id);

-- Fix leads_veiculos policies
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."leads_veiculos";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."leads_veiculos";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."leads_veiculos";
DROP POLICY IF EXISTS "Leads are viewable by everyone" ON "public"."leads_veiculos";
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON "public"."leads_veiculos";
DROP POLICY IF EXISTS "Authenticated users can update leads" ON "public"."leads_veiculos";

CREATE POLICY "Leads are viewable by everyone" 
ON "public"."leads_veiculos" FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert leads" 
ON "public"."leads_veiculos" FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads" 
ON "public"."leads_veiculos" FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Fix buyer_authorizations policies
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."buyer_authorizations";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."buyer_authorizations";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."buyer_authorizations";
DROP POLICY IF EXISTS "Buyer authorizations are viewable by everyone" ON "public"."buyer_authorizations";
DROP POLICY IF EXISTS "Authenticated users can manage authorizations" ON "public"."buyer_authorizations";

CREATE POLICY "Buyer authorizations are viewable by everyone" 
ON "public"."buyer_authorizations" FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage authorizations" 
ON "public"."buyer_authorizations" FOR ALL 
USING (auth.role() = 'authenticated');

-- Create internal_messages table
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES public.leads_veiculos(id)
);

-- Enable RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Policies for internal_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.internal_messages;

CREATE POLICY "Users can view their own messages" 
ON public.internal_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" 
ON public.internal_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
