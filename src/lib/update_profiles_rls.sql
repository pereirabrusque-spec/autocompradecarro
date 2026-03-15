-- 1. Remover políticas existentes para profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2. Recriar políticas para profiles
-- Permite que qualquer usuário autenticado leia os perfis (para ver nomes e avatares)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');
