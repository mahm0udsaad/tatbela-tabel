"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { searchService, SearchSuggestion } from "@/lib/search"
import { cn } from "@/lib/utils"

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  className?: string
  showRecentSearches?: boolean
  showPopularSearches?: boolean
  maxSuggestions?: number
  debounceMs?: number
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "ابحث عن منتج...",
  className,
  showRecentSearches = true,
  showPopularSearches = true,
  maxSuggestions = 8,
  debounceMs = 300
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load recent and popular searches on mount
  useEffect(() => {
    if (showRecentSearches) {
      searchService.getRecentSearches(5).then(setRecentSearches)
    }
    if (showPopularSearches) {
      searchService.getPopularSearches(5).then(setPopularSearches)
    }
  }, [showRecentSearches, showPopularSearches])

  // Handle input changes with debouncing
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchService.getSuggestions(value.trim(), maxSuggestions)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, maxSuggestions, debounceMs])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    const allItems = [
      ...(value.trim() ? [] : [...recentSearches, ...popularSearches]),
      ...suggestions
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          const selectedItem = allItems[selectedIndex]
          if (typeof selectedItem === 'string') {
            handleSubmit(selectedItem)
          } else {
            handleSubmit(selectedItem.suggestion)
          }
        } else {
          handleSubmit(value)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, selectedIndex, value, suggestions, recentSearches, popularSearches])

  // Handle form submission
  const handleSubmit = useCallback((searchValue: string) => {
    onSubmit(searchValue.trim())
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }, [onSubmit])

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsOpen(true)
    setSelectedIndex(-1)
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)
  }, [onChange])

  // Clear search
  const handleClear = useCallback(() => {
    onChange('')
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [onChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Render suggestion item
  const renderSuggestion = (item: SearchSuggestion | string, index: number) => {
    const isString = typeof item === 'string'
    const text = isString ? item : item.suggestion
    const type = isString ? null : item.type
    const isSelected = selectedIndex === index

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleSubmit(text)}
        className={cn(
          "w-full px-4 py-3 text-right flex items-center justify-between hover:bg-[#F5F1E8] transition-colors",
          isSelected && "bg-[#E8A835]/10"
        )}
      >
        <div className="flex items-center gap-3">
          {type === 'product' && <Search size={16} className="text-[#8B6F47]" />}
          {type === 'brand' && <span className="text-xs px-2 py-1 bg-[#E8A835]/20 text-[#E8A835] rounded-full">علامة تجارية</span>}
          {type === 'category' && <span className="text-xs px-2 py-1 bg-[#2B2520]/10 text-[#2B2520] rounded-full">فئة</span>}
          {isString && recentSearches.includes(item) && <Clock size={16} className="text-[#8B6F47]" />}
          {isString && popularSearches.includes(item) && <TrendingUp size={16} className="text-[#8B6F47]" />}
          <span className="text-[#2B2520]">{text}</span>
        </div>
        {!isString && item.count > 1 && (
          <span className="text-xs text-[#8B6F47]">({item.count})</span>
        )}
      </button>
    )
  }

  const showDropdown = isOpen && (
    (value.trim() && (suggestions.length > 0 || isLoading)) ||
    (!value.trim() && (recentSearches.length > 0 || popularSearches.length > 0))
  )

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 pr-12 rounded-xl border-2 border-[#D9D4C8] focus:border-[#E8A835] focus:outline-none text-base bg-white shadow-sm",
            className
          )}
          dir="rtl"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-[#F5F1E8] rounded-full transition-colors"
              aria-label="مسح البحث"
            >
              <X size={16} className="text-[#8B6F47]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(value)}
            className="p-1 hover:bg-[#F5F1E8] rounded-full transition-colors"
            aria-label="بحث"
          >
            <Search size={18} className="text-[#8B6F47]" />
          </button>
        </div>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#E8E2D1] z-50 max-h-96 overflow-y-auto"
        >
          {value.trim() ? (
            // Search suggestions
            <>
              {isLoading && (
                <div className="px-4 py-3 text-center text-[#8B6F47]">
                  جاري البحث...
                </div>
              )}
              {!isLoading && suggestions.length === 0 && (
                <div className="px-4 py-3 text-center text-[#8B6F47]">
                  لا توجد اقتراحات
                </div>
              )}
              {!isLoading && suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
            </>
          ) : (
            // Recent and popular searches
            <>
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-[#F5F1E8] border-b border-[#E8E2D1]">
                    <h4 className="text-sm font-semibold text-[#2B2520] flex items-center gap-2">
                      <Clock size={14} />
                      عمليات البحث الأخيرة
                    </h4>
                  </div>
                  {recentSearches.map((search, index) => renderSuggestion(search, index))}
                </div>
              )}
              {popularSearches.length > 0 && (
                <div>
                  {recentSearches.length > 0 && <div className="border-t border-[#E8E2D1]" />}
                  <div className="px-4 py-2 bg-[#F5F1E8] border-b border-[#E8E2D1]">
                    <h4 className="text-sm font-semibold text-[#2B2520] flex items-center gap-2">
                      <TrendingUp size={14} />
                      الأكثر بحثاً
                    </h4>
                  </div>
                  {popularSearches.map((search, index) =>
                    renderSuggestion(search, recentSearches.length + index)
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
