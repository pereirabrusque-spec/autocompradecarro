-- Ensure buyer_proposals has the correct column for final price
ALTER TABLE IF EXISTS buyer_proposals ADD COLUMN IF NOT EXISTS proposta_final NUMERIC;
-- If final_price is no longer needed/used in code, it could be dropped.
-- ALTER TABLE IF EXISTS buyer_proposals DROP COLUMN IF EXISTS final_price;
