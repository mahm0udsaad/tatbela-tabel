-- Enhanced Search and Analytics
-- Adds search analytics tracking and improved search capabilities

-- Create search queries table for analytics
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  has_clicks BOOLEAN DEFAULT FALSE,
  search_source TEXT DEFAULT 'navbar', -- navbar, store, b2b
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search clicks table to track which results users click
CREATE TABLE IF NOT EXISTS public.search_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query_id UUID REFERENCES public.search_queries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- position in search results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON public.search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_search_query_id ON public.search_clicks(search_query_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_product_id ON public.search_clicks(product_id);

-- Enable RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow inserts for all users, reads for admin only
CREATE POLICY "Allow all users to insert search queries" ON public.search_queries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admins to read search queries" ON public.search_queries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow all users to insert search clicks" ON public.search_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admins to read search clicks" ON public.search_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function for enhanced search with full-text search
CREATE OR REPLACE FUNCTION search_products_enhanced(
  search_query TEXT,
  category_ids UUID[] DEFAULT NULL,
  brand_filter TEXT[] DEFAULT NULL,
  price_min NUMERIC DEFAULT NULL,
  price_max NUMERIC DEFAULT NULL,
  b2b_mode BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'relevance'
)
RETURNS TABLE (
  id UUID,
  name_ar TEXT,
  description_ar TEXT,
  brand TEXT,
  type TEXT,
  price NUMERIC,
  original_price NUMERIC,
  rating NUMERIC,
  reviews_count INTEGER,
  stock INTEGER,
  category_id UUID,
  is_featured BOOLEAN,
  is_b2b BOOLEAN,
  b2b_price_hidden BOOLEAN,
  product_images JSONB,
  product_variants JSONB,
  search_rank NUMERIC,
  relevance_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT
      p.id,
      p.name_ar,
      p.description_ar,
      p.brand,
      p.type,
      p.price,
      p.original_price,
      p.rating,
      p.reviews_count,
      p.stock,
      p.category_id,
      p.is_featured,
      p.is_b2b,
      p.b2b_price_hidden,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'image_url', pi.image_url,
            'is_primary', pi.is_primary
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::jsonb
      ) as product_images,
      COALESCE(
        jsonb_agg(
          jsonb_build_object('stock', pv.stock)
        ) FILTER (WHERE pv.id IS NOT NULL),
        '[]'::jsonb
      ) as product_variants,
      -- Calculate relevance score
      CASE
        WHEN search_query IS NULL OR search_query = '' THEN 1.0
        ELSE
          -- Full-text search ranking
          ts_rank_cd(
            to_tsvector('arabic', COALESCE(p.name_ar, '') || ' ' ||
                                   COALESCE(p.description_ar, '') || ' ' ||
                                   COALESCE(p.brand, '') || ' ' ||
                                   COALESCE(p.type, '') || ' ' ||
                                   COALESCE(c.name_ar, '')),
            plainto_tsquery('arabic', search_query)
          ) +
          -- Exact name match bonus
          CASE WHEN p.name_ar ILIKE '%' || search_query || '%' THEN 0.5 ELSE 0 END +
          -- Brand match bonus
          CASE WHEN p.brand ILIKE '%' || search_query || '%' THEN 0.3 ELSE 0 END +
          -- Category match bonus
          CASE WHEN c.name_ar ILIKE '%' || search_query || '%' THEN 0.2 ELSE 0 END
      END as relevance_score,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE
            WHEN sort_by = 'relevance' AND search_query IS NOT NULL AND search_query != '' THEN
              ts_rank_cd(
                to_tsvector('arabic', COALESCE(p.name_ar, '') || ' ' ||
                                       COALESCE(p.description_ar, '') || ' ' ||
                                       COALESCE(p.brand, '') || ' ' ||
                                       COALESCE(p.type, '') || ' ' ||
                                       COALESCE(c.name_ar, '')),
                plainto_tsquery('arabic', search_query)
              ) +
              CASE WHEN p.name_ar ILIKE '%' || search_query || '%' THEN 0.5 ELSE 0 END +
              CASE WHEN p.brand ILIKE '%' || search_query || '%' THEN 0.3 ELSE 0 END +
              CASE WHEN c.name_ar ILIKE '%' || search_query || '%' THEN 0.2 ELSE 0 END
            ELSE 0
          END DESC,
          CASE WHEN sort_by = 'price-low' THEN p.price END ASC,
          CASE WHEN sort_by = 'price-high' THEN p.price END DESC,
          CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
          CASE WHEN sort_by = 'rating' THEN p.rating END DESC,
          CASE WHEN sort_by = 'popularity' THEN p.reviews_count END DESC,
          p.sort_order ASC,
          p.created_at DESC
      ) as search_rank
    FROM public.products p
    LEFT JOIN public.product_images pi ON p.id = pi.product_id
    LEFT JOIN public.product_variants pv ON p.id = pv.product_id
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.is_archived = false
      AND p.is_b2b = b2b_mode
      AND (category_ids IS NULL OR p.category_id = ANY(category_ids))
      AND (brand_filter IS NULL OR p.brand = ANY(brand_filter))
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (
        search_query IS NULL OR
        search_query = '' OR
        -- Full-text search
        to_tsvector('arabic', COALESCE(p.name_ar, '') || ' ' ||
                               COALESCE(p.description_ar, '') || ' ' ||
                               COALESCE(p.brand, '') || ' ' ||
                               COALESCE(p.type, '') || ' ' ||
                               COALESCE(c.name_ar, '')) @@
        plainto_tsquery('arabic', search_query)
        OR
        -- Fallback to ILIKE for partial matches
        p.name_ar ILIKE '%' || search_query || '%' OR
        p.description_ar ILIKE '%' || search_query || '%' OR
        p.brand ILIKE '%' || search_query || '%' OR
        p.type ILIKE '%' || search_query || '%' OR
        c.name_ar ILIKE '%' || search_query || '%'
      )
    GROUP BY p.id, p.name_ar, p.description_ar, p.brand, p.type, p.price,
             p.original_price, p.rating, p.reviews_count, p.stock, p.category_id,
             p.is_featured, p.is_b2b, p.b2b_price_hidden, p.created_at, p.sort_order, c.name_ar
  )
  SELECT
    sr.id,
    sr.name_ar,
    sr.description_ar,
    sr.brand,
    sr.type,
    sr.price,
    sr.original_price,
    sr.rating,
    sr.reviews_count,
    sr.stock,
    sr.category_id,
    sr.is_featured,
    sr.is_b2b,
    sr.b2b_price_hidden,
    sr.product_images,
    sr.product_variants,
    sr.search_rank,
    sr.relevance_score
  FROM search_results sr
  WHERE sr.search_rank > offset_count
    AND sr.search_rank <= (offset_count + limit_count)
  ORDER BY sr.search_rank;
END;
$$;

-- Create function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  query_prefix TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT,
  count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Product name suggestions
    SELECT
      p.name_ar as suggestion,
      'product'::TEXT as type,
      COUNT(*)::INTEGER as count
    FROM public.products p
    WHERE p.is_archived = false
      AND p.name_ar ILIKE query_prefix || '%'
    GROUP BY p.name_ar

    UNION ALL

    -- Brand suggestions
    SELECT
      p.brand as suggestion,
      'brand'::TEXT as type,
      COUNT(*)::INTEGER as count
    FROM public.products p
    WHERE p.is_archived = false
      AND p.brand ILIKE query_prefix || '%'
    GROUP BY p.brand

    UNION ALL

    -- Category suggestions
    SELECT
      c.name_ar as suggestion,
      'category'::TEXT as type,
      COUNT(p.id)::INTEGER as count
    FROM public.categories c
    LEFT JOIN public.products p ON c.id = p.category_id AND p.is_archived = false
    WHERE c.name_ar ILIKE query_prefix || '%'
    GROUP BY c.id, c.name_ar
  ) combined
  ORDER BY count DESC, suggestion
  LIMIT limit_count;
END;
$$;

-- Create function to track search query
CREATE OR REPLACE FUNCTION track_search_query(
  user_id_param UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  query_param TEXT DEFAULT '',
  results_count_param INTEGER DEFAULT 0,
  search_source_param TEXT DEFAULT 'navbar',
  user_agent_param TEXT DEFAULT NULL,
  ip_address_param INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  search_query_id UUID;
BEGIN
  INSERT INTO public.search_queries (
    user_id,
    session_id,
    query,
    results_count,
    search_source,
    user_agent,
    ip_address
  ) VALUES (
    user_id_param,
    session_id_param,
    query_param,
    results_count_param,
    search_source_param,
    user_agent_param,
    ip_address_param
  )
  RETURNING id INTO search_query_id;

  RETURN search_query_id;
END;
$$;

-- Create function to track search click
CREATE OR REPLACE FUNCTION track_search_click(
  search_query_id_param UUID,
  product_id_param UUID,
  position_param INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.search_clicks (
    search_query_id,
    product_id,
    position
  ) VALUES (
    search_query_id_param,
    product_id_param,
    position_param
  );
END;
$$;
