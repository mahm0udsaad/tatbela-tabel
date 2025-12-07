-- Add pricing mode support (unit price vs price per kilo)
alter table products
  add column if not exists pricing_mode text not null default 'unit',
  add column if not exists price_per_kilo numeric;

-- Backfill pricing_mode for existing rows
update products
set pricing_mode = 'unit'
where pricing_mode is null;

