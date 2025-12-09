-- First, update all NULL transaction_date values to filed_date
UPDATE insider_trades 
SET transaction_date = filed_date 
WHERE transaction_date IS NULL;

-- Then make the column NOT NULL
ALTER TABLE insider_trades 
ALTER COLUMN transaction_date SET NOT NULL;
