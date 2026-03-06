-- CORREÇÃO DE POLÍTICAS RLS (Row Level Security)
-- Execute este script no SQL Editor do Supabase para corrigir o erro de recursão infinita.

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads_veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_authorizations DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 3. Criar função segura para verificar se é admin
-- Esta função usa SECURITY DEFINER para ignorar as políticas RLS ao ser executada
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o email do usuário atual está na lista de admins ou tem a role 'admin'
  -- Ajuste a lógica conforme sua necessidade. Aqui assumimos que existe um campo 'role' no profile
  -- ou verificamos emails específicos.
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND (email = 'pereira.brusque@gmail.com' OR raw_user_meta_data->>'role' = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar Políticas para PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leitura: Usuários veem o próprio perfil, Admins veem todos
CREATE POLICY "Profiles viewable by owner or admin" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Inserção: Usuários podem criar seu próprio perfil (ao se cadastrar)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Atualização: Usuários editam o próprio perfil, Admins editam todos
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- 5. Recriar Políticas para LEADS_VEICULOS
ALTER TABLE leads_veiculos ENABLE ROW LEVEL SECURITY;

-- Leitura: Admins veem tudo. Compradores veem apenas o que foram autorizados.
CREATE POLICY "Leads viewable by admin or authorized buyer" ON leads_veiculos
  FOR SELECT USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM buyer_authorizations ba
      JOIN interested_buyers ib ON ba.buyer_id = ib.id
      WHERE ib.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ba.lead_id = leads_veiculos.id
    )
  );

-- Escrita: Apenas Admins e o dono do lead (se houver conceito de dono) podem editar
CREATE POLICY "Admins can manage leads" ON leads_veiculos
  FOR ALL USING (
    public.is_admin()
  );

-- 6. Recriar Políticas para BUYER_AUTHORIZATIONS
ALTER TABLE buyer_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage authorizations" ON buyer_authorizations
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Buyers view own authorizations" ON buyer_authorizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interested_buyers ib
      WHERE ib.id = buyer_authorizations.buyer_id
      AND ib.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 7. Recriar Políticas para INTERESTED_BUYERS
ALTER TABLE interested_buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage buyers" ON interested_buyers
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Buyers view own record" ON interested_buyers
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
