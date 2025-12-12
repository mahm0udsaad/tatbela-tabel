import { getSupabaseClient } from "./supabase"

export interface SearchSuggestion {
  suggestion: string
  type: 'product' | 'brand' | 'category'
  count: number
}

export interface SearchResult {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  type: string | null
  price: number
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  category_id: string | null
  is_featured: boolean | null
  is_b2b: boolean | null
  b2b_price_hidden: boolean | null
  product_images: any
  product_variants: any
  search_rank: number
  relevance_score: number
}

export interface SearchAnalytics {
  queryId: string
  query: string
  resultsCount: number
  source: 'navbar' | 'store' | 'b2b'
}

class SearchService {
  private supabase = getSupabaseClient()

  /**
   * Perform enhanced search with full-text capabilities
   */
  async searchProducts({
    query,
    categoryIds,
    brands,
    priceMin,
    priceMax,
    isB2B = false,
    limit = 50,
    offset = 0,
    sortBy = 'relevance'
  }: {
    query?: string
    categoryIds?: string[]
    brands?: string[]
    priceMin?: number
    priceMax?: number
    isB2B?: boolean
    limit?: number
    offset?: number
    sortBy?: string
  }): Promise<{ data: SearchResult[] | null, count: number, analytics?: SearchAnalytics }> {
    try {
      const { data, error } = await this.supabase.rpc('search_products_enhanced', {
        search_query: query || null,
        category_ids: categoryIds || null,
        brand_filter: brands || null,
        price_min: priceMin || null,
        price_max: priceMax || null,
        b2b_mode: isB2B,
        limit_count: limit,
        offset_count: offset,
        sort_by: sortBy
      })

      if (error) throw error

      // Track search analytics if there's a query
      let analytics: SearchAnalytics | undefined
      if (query?.trim()) {
        analytics = await this.trackSearch(query.trim(), data?.length || 0, 'store')
      }

      return {
        data: data as SearchResult[] || [],
        count: data?.length || 0,
        analytics
      }
    } catch (error) {
      console.error('Search error:', error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    if (!query?.trim()) return []

    try {
      const { data, error } = await this.supabase.rpc('get_search_suggestions', {
        query_prefix: query.trim(),
        limit_count: limit
      })

      if (error) throw error

      return (data as SearchSuggestion[]) || []
    } catch (error) {
      console.error('Suggestions error:', error)
      return []
    }
  }

  /**
   * Track search query for analytics
   */
  private async trackSearch(query: string, resultsCount: number, source: 'navbar' | 'store' | 'b2b'): Promise<SearchAnalytics> {
    try {
      // Get user session
      const { data: session } = await this.supabase.auth.getSession()
      const userId = session.session?.user?.id || null

      // Generate session ID if not logged in
      const sessionId = userId ? null : this.getSessionId()

      const { data, error } = await this.supabase.rpc('track_search_query', {
        user_id_param: userId,
        session_id_param: sessionId,
        query_param: query,
        results_count_param: resultsCount,
        search_source_param: source,
        user_agent_param: navigator.userAgent,
        ip_address_param: null // IP will be captured server-side
      })

      if (error) throw error

      return {
        queryId: data,
        query,
        resultsCount,
        source
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
      return {
        queryId: '',
        query,
        resultsCount,
        source
      }
    }
  }

  /**
   * Track when a user clicks on a search result
   */
  async trackSearchClick(queryId: string, productId: string, position: number): Promise<void> {
    if (!queryId) return

    try {
      const { error } = await this.supabase.rpc('track_search_click', {
        search_query_id_param: queryId,
        product_id_param: productId,
        position_param: position
      })

      if (error) throw error
    } catch (error) {
      console.error('Click tracking error:', error)
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit = 10): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('search_queries')
        .select('query')
        .not('query', 'is', null)
        .neq('query', '')
        .order('created_at', { ascending: false })
        .limit(1000) // Get recent searches

      if (error) throw error

      // Count frequency and sort by popularity
      const frequency: Record<string, number> = {}
      data?.forEach(item => {
        const query = item.query.toLowerCase().trim()
        frequency[query] = (frequency[query] || 0) + 1
      })

      return Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([query]) => query)
    } catch (error) {
      console.error('Popular searches error:', error)
      return []
    }
  }

  /**
   * Get recent searches for current user/session
   */
  async getRecentSearches(limit = 5): Promise<string[]> {
    try {
      const { data: session } = await this.supabase.auth.getSession()
      const userId = session.session?.user?.id
      const sessionId = this.getSessionId()

      let query = this.supabase
        .from('search_queries')
        .select('query')
        .not('query', 'is', null)
        .neq('query', '')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(item => item.query) || []
    } catch (error) {
      console.error('Recent searches error:', error)
      return []
    }
  }

  /**
   * Generate or retrieve session ID for anonymous users
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return ''

    let sessionId = localStorage.getItem('search_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('search_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Clear search history for current user/session
   */
  async clearSearchHistory(): Promise<void> {
    try {
      const { data: session } = await this.supabase.auth.getSession()
      const userId = session.session?.user?.id
      const sessionId = this.getSessionId()

      let query = this.supabase.from('search_queries')

      if (userId) {
        query = query.delete().eq('user_id', userId)
      } else {
        query = query.delete().eq('session_id', sessionId)
      }

      const { error } = await query
      if (error) throw error
    } catch (error) {
      console.error('Clear history error:', error)
    }
  }
}

// Export singleton instance
export const searchService = new SearchService()
