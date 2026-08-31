-- Allow offer IDs and custom items in order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
