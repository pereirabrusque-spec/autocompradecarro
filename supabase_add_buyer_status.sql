-- Add status column to interested_buyers
ALTER TABLE public.interested_buyers ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente';

-- Update existing buyers to have a status
UPDATE public.interested_buyers SET status = 'autorizado' WHERE status IS NULL;
