ALTER TABLE public.crm_sales_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.crm_sales_conversations ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;
