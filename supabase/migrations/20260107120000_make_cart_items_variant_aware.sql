-- Allow multiple variants of the same product to coexist in the same cart.
-- We enforce uniqueness differently depending on whether the row has a variant:
-- - No variant: unique(cart_id, product_id) where product_variant_id is null
-- - With variant: unique(cart_id, product_id, product_variant_id) where product_variant_id is not null

alter table cart_items
  drop constraint if exists cart_items_cart_id_product_id_key;

-- Some projects may have used a differently-named constraint; try to drop common names safely.
alter table cart_items
  drop constraint if exists cart_items_cart_id_product_id_uniq;

create unique index if not exists cart_items_unique_product_without_variant
  on cart_items (cart_id, product_id)
  where product_variant_id is null;

create unique index if not exists cart_items_unique_product_with_variant
  on cart_items (cart_id, product_id, product_variant_id)
  where product_variant_id is not null;


