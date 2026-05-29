-- Get current DB columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'PurchaseRequests' ORDER BY ordinal_position;
