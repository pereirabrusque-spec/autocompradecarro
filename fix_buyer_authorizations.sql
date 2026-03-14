ALTER TABLE public.buyer_authorizations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_buyer_authorizations_updated_at ON public.buyer_authorizations;

CREATE TRIGGER update_buyer_authorizations_updated_at
    BEFORE UPDATE ON public.buyer_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
