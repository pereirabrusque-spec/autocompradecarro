-- 1. Garantir que a tabela e a coluna existam
CREATE TABLE IF NOT EXISTS public.buyer_authorizations (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{}'::jsonb
);

-- Adicionar a coluna se não existir
ALTER TABLE public.buyer_authorizations ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- 2. Função para definir permissões padrão baseadas no cargo
CREATE OR REPLACE FUNCTION public.set_default_permissions(p_user_id uuid, p_role text)
RETURNS void AS $$
DECLARE
  v_permissions jsonb;
BEGIN
  CASE p_role
    WHEN 'buyer' THEN
      v_permissions := '{"can_view_photos": true, "can_view_details": false, "can_view_client_data": false, "can_whatsapp": false}'::jsonb;
    WHEN 'buyer_premium' THEN
      v_permissions := '{"can_view_photos": true, "can_view_details": true, "can_view_client_data": false, "can_whatsapp": false}'::jsonb;
    WHEN 'buyer_master' THEN
      v_permissions := '{"can_view_photos": true, "can_view_details": true, "can_view_client_data": true, "can_whatsapp": true}'::jsonb;
    ELSE
      v_permissions := '{"can_view_photos": true, "can_view_details": false, "can_view_client_data": false, "can_whatsapp": false}'::jsonb;
  END CASE;

  INSERT INTO public.buyer_authorizations (user_id, permissions)
  VALUES (p_user_id, v_permissions)
  ON CONFLICT (user_id) DO UPDATE SET permissions = v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar a função de promoção para chamar a definição de permissões
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  
  -- Chama a automação de permissões
  PERFORM public.set_default_permissions(target_user_id, new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
