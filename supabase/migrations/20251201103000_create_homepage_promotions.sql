-- Manageable promo section for the storefront hero promo band
create table if not exists public.homepage_promotions (
  id uuid primary key default gen_random_uuid(),
  tagline text,
  title text not null,
  description text,
  cta_label text,
  cta_url text,
  background_from text default '#0f2027',
  background_via text default '#203a43',
  background_to text default '#2c5364',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.homepage_promotions enable row level security;

create policy "Homepage promo is public"
  on public.homepage_promotions
  for select
  using (true);

create policy "Admins manage homepage promo"
  on public.homepage_promotions
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'::user_role
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'::user_role
    )
  );

-- Seed a default record so the homepage keeps rendering until the admin edits it
insert into public.homepage_promotions (
  tagline,
  title,
  description,
  cta_label,
  cta_url,
  background_from,
  background_via,
  background_to,
  is_active
)
select
  'عرض حصري محدود',
  'خصم 10% على كل المنتجات',
  'استمتع بأفضل التوابل المصرية الأصلية بسعر خاص. العرض محدود الوقت فقط!',
  'اغتنم العرض الآن',
  '/store',
  '#0f2027',
  '#203a43',
  '#2c5364',
  true
where not exists (
  select 1 from public.homepage_promotions
);


