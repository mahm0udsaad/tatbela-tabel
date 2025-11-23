-- Adds a featured flag that can be toggled from the admin UI
alter table public.products
  add column if not exists is_featured boolean not null default false;

-- Seed 4 products as featured so the storefront has content right away.
-- Adjust the filtering clause if you prefer specific IDs.
with seeded as (
  select id
  from public.products
  order by coalesce(updated_at, created_at) desc
  limit 4
)
update public.products
set is_featured = true
where id in (select id from seeded);

