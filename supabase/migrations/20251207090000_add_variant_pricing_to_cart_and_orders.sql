-- Add optional variant tracking and per-item price snapshot
alter table cart_items
  add column if not exists unit_price numeric,
  add column if not exists product_variant_id uuid references product_variants(id) on delete set null;

-- Backfill unit_price with current product price when missing
update cart_items ci
set unit_price = p.price
from products p
where ci.unit_price is null
  and ci.product_id = p.id;

-- Ensure future nulls default to product price via trigger-friendly default
alter table cart_items
  alter column unit_price set default 0;

-- Track variant on orders as well (optional)
alter table order_items
  add column if not exists product_variant_id uuid references product_variants(id) on delete set null,
  add column if not exists unit_price numeric;

update order_items oi
set unit_price = price
where unit_price is null;

