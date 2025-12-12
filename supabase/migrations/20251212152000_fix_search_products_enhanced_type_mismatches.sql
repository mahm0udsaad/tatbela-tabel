-- Fix type mismatches in search_products_enhanced
-- - search_rank: ROW_NUMBER() returns bigint, but function expects numeric
-- - relevance_score: ts_rank_cd / numeric additions can yield double precision, but function expects numeric

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
      -- Calculate relevance score (cast to numeric to match RETURNS TABLE)
      (
        CASE
          WHEN search_query IS NULL OR search_query = '' THEN 1.0
          ELSE
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
        END
      )::numeric as relevance_score,
      -- ROW_NUMBER() returns bigint; cast to numeric to match RETURNS TABLE
      (ROW_NUMBER() OVER (
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
      ))::numeric as search_rank
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


