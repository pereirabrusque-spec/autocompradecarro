-- Ensure buyer_proposals has the correct structure
ALTER TABLE IF EXISTS buyer_proposals ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE IF EXISTS buyer_proposals ADD COLUMN IF NOT EXISTS proposta_final NUMERIC;
-- Keep existing columns if necessary
