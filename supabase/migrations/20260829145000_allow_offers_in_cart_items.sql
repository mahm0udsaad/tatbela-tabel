-- Allow offer IDs in cart_items by dropping foreign key constraint to products(id)
alter table cart_items
  drop constraint if exists cart_items_product_id_fkey;
