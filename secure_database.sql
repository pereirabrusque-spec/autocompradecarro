-- ============================================================================
-- SCRIPT DE SEGURANÇA E PROTEÇÃO DE DADOS (RLS)
-- Este script habilita Row-Level Security (RLS) e define políticas rigorosas
-- para proteger contra acesso não autorizado, conforme alerta do Supabase.
-- ============================================================================

-- 1. FUNÇÕES AUXILIARES DE SEGURANÇA
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- 1. Check email from JWT first (fastest)
  user_email := auth.jwt() ->> 'email';
  IF user_email = 'pereira.brusque@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Check role in profiles table
  -- SECURITY DEFINER bypasses RLS, avoiding recursion
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  
  IF user_role = 'admin' OR user_role = 'master' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'seller' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_buyer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role LIKE 'buyer%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fipe_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interested_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_crm_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA 'profiles'
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles can be created by owner" ON public.profiles;
CREATE POLICY "Profiles can be created by owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be updated by owner or admin" ON public.profiles;
CREATE POLICY "Profiles can be updated by owner or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 4. POLÍTICAS PARA 'api_keys' (CRÍTICO: APENAS ADMIN)
DROP POLICY IF EXISTS "API keys are only accessible by admin" ON public.api_keys;
CREATE POLICY "API keys are only accessible by admin" ON public.api_keys
  FOR ALL USING (public.is_admin());

-- 5. POLÍTICAS PARA 'leads_veiculos'
DROP POLICY IF EXISTS "Leads are viewable by admin, seller or authorized buyer" ON public.leads_veiculos;
CREATE POLICY "Leads are viewable by admin, seller or authorized buyer" ON public.leads_veiculos
  FOR SELECT USING (
    public.is_admin() OR 
    public.is_seller() OR 
    -- Comprador Master e Premium podem ver o estoque (Premium vê limitado via UI, Master vê tudo)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'buyer_master' OR role = 'buyer_premium')
    ) OR
    -- Compradores normais só veem o que for explicitamente autorizado
    EXISTS (
      SELECT 1 FROM public.buyer_crm_permissions 
      WHERE buyer_id = auth.uid() AND lead_id = public.leads_veiculos.id
    )
  );

DROP POLICY IF EXISTS "Leads can be inserted by anyone" ON public.leads_veiculos;
CREATE POLICY "Leads can be inserted by anyone" ON public.leads_veiculos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leads can be updated by admin or seller" ON public.leads_veiculos;
CREATE POLICY "Leads can be updated by admin or seller" ON public.leads_veiculos
  FOR UPDATE USING (public.is_admin() OR public.is_seller());

DROP POLICY IF EXISTS "Leads can be deleted by admin" ON public.leads_veiculos;
CREATE POLICY "Leads can be deleted by admin" ON public.leads_veiculos
  FOR DELETE USING (public.is_admin());

-- 6. POLÍTICAS PARA 'internal_messages'
DROP POLICY IF EXISTS "Internal messages viewable by participants or admin" ON public.internal_messages;
CREATE POLICY "Internal messages viewable by participants or admin" ON public.internal_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR receiver_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Internal messages can be inserted by authenticated users" ON public.internal_messages;
CREATE POLICY "Internal messages can be inserted by authenticated users" ON public.internal_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 7. POLÍTICAS PARA 'mensagens' (Chat de Leads)
DROP POLICY IF EXISTS "Mensagens are viewable by admin, seller or participants" ON public.mensagens;
CREATE POLICY "Mensagens are viewable by admin, seller or participants" ON public.mensagens
  FOR SELECT USING (public.is_admin() OR public.is_seller() OR true); -- Permitimos leitura pública para o widget de chat funcionar

DROP POLICY IF EXISTS "Mensagens can be inserted by anyone" ON public.mensagens;
CREATE POLICY "Mensagens can be inserted by anyone" ON public.mensagens
  FOR INSERT WITH CHECK (true);

-- 8. POLÍTICAS PARA TABELAS DE CONFIGURAÇÃO (Leitura pública, Escrita Admin)
-- settings, banks, repair_costs, fipe_rules, providers, banners
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['settings', 'banks', 'repair_costs', 'fipe_rules', 'providers', 'banners'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public read access for %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Public read access for %I" ON public.%I FOR SELECT USING (true)', t, t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Admin write access for %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Admin write access for %I" ON public.%I FOR ALL USING (public.is_admin())', t, t);
    END LOOP;
END $$;

-- 9. POLÍTICAS PARA 'interested_buyers'
DROP POLICY IF EXISTS "Buyers viewable by admin or owner" ON public.interested_buyers;
CREATE POLICY "Buyers viewable by admin or owner" ON public.interested_buyers
  FOR SELECT USING (public.is_admin() OR public.is_seller() OR auth.uid() = id);

DROP POLICY IF EXISTS "Buyers can be inserted by anyone" ON public.interested_buyers;
CREATE POLICY "Buyers can be inserted by anyone" ON public.interested_buyers
  FOR INSERT WITH CHECK (true);

-- 10. POLÍTICAS PARA 'buyer_crm_permissions'
DROP POLICY IF EXISTS "Permissions viewable by admin or buyer" ON public.buyer_crm_permissions;
CREATE POLICY "Permissions viewable by admin or buyer" ON public.buyer_crm_permissions
  FOR SELECT USING (public.is_admin() OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Permissions manageable by admin" ON public.buyer_crm_permissions;
CREATE POLICY "Permissions manageable by admin" ON public.buyer_crm_permissions
  FOR ALL USING (public.is_admin());

-- 11. POLÍTICAS CONDICIONAIS PARA TABELAS QUE PODEM NÃO EXISTIR
DO $$
BEGIN
    -- admin_users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Admin users viewable by admin" ON public.admin_users;
        CREATE POLICY "Admin users viewable by admin" ON public.admin_users FOR SELECT USING (public.is_admin());
    END IF;

    -- messages (algumas versões usam 'messages' em vez de 'mensagens')
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Messages viewable by admin or seller" ON public.messages;
        CREATE POLICY "Messages viewable by admin or seller" ON public.messages FOR ALL USING (public.is_admin() OR public.is_seller());
    END IF;

    -- ai_agent_rules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_agent_rules') THEN
        ALTER TABLE public.ai_agent_rules ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "AI rules manageable by admin" ON public.ai_agent_rules;
        CREATE POLICY "AI rules manageable by admin" ON public.ai_agent_rules FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- MENSAGEM DE FINALIZAÇÃO
SELECT 'Segurança do banco de dados reforçada com sucesso!' as status;
