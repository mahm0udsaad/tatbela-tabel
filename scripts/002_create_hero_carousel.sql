-- Hero carousel images for the landing page
CREATE TABLE IF NOT EXISTS public.hero_carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_carousel_images ENABLE ROW LEVEL SECURITY;

-- Everyone can read the carousel
CREATE POLICY "Hero carousel is public" 
  ON public.hero_carousel_images
  FOR SELECT
  USING (true);

-- Only admins (profiles.is_admin) can mutate
CREATE POLICY "Admins manage hero carousel"
  ON public.hero_carousel_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS hero_carousel_images_sort_idx ON public.hero_carousel_images(sort_order, created_at);
