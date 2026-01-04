-- Add has_tax column to products table
-- This column indicates whether a product is subject to 14% tax

ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_tax BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN products.has_tax IS 'Indicates if the product is subject to 14% tax';

-- Update existing products to have no tax by default
UPDATE products
SET has_tax = false
WHERE has_tax IS NULL;

