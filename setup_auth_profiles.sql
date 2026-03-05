-- CONFIGURAÇÃO DE PERFIS E PERMISSÕES (AUTH)
-- Copie e cole no SQL Editor do Supabase e clique em "Run".

-- 1. Criar tabela de perfis (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso
-- Leitura: Todos podem ler seus próprios dados. Admins podem ler tudo.
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Atualização: Usuários editam o próprio perfil.
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Trigger para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id, 
    new.email, 
    'user', -- Padrão é user. Mude manualmente para admin no banco se necessário.
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se já existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Política para Mensagens (Chat)
-- Permitir que usuários vejam mensagens onde eles são o lead (precisamos vincular lead ao user_id futuramente)
-- Por enquanto, vamos permitir leitura se o lead tiver o email do usuário ou se for admin.

-- Adicionar coluna user_id na tabela leads_veiculos para vincular ao login
ALTER TABLE public.leads_veiculos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Atualizar política de leads para usuários verem seus próprios leads
CREATE POLICY "Users can view own leads" ON public.leads_veiculos
  FOR SELECT USING (auth.uid() = user_id);

-- Atualizar política de mensagens
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their leads" ON public.mensagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads_veiculos 
      WHERE leads_veiculos.id = mensagens.lead_id 
      AND leads_veiculos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their leads" ON public.mensagens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads_veiculos 
      WHERE leads_veiculos.id = lead_id 
      AND leads_veiculos.user_id = auth.uid()
    )
  );

SELECT 'Sistema de Auth e Perfis configurado com sucesso!' as status;
