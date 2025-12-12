"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SearchHighlighterProps {
  text: string
  searchTerm: string
  className?: string
  highlightClassName?: string
}

/**
 * Highlights search terms in text with a subtle background
 */
export function SearchHighlighter({
  text,
  searchTerm,
  className,
  highlightClassName = "bg-[#E8A835]/20 rounded px-1"
}: SearchHighlighterProps) {
  if (!searchTerm?.trim() || !text) {
    return <span className={className}>{text}</span>
  }

  const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0)
  if (searchWords.length === 0) {
    return <span className={className}>{text}</span>
  }

  // Create a regex that matches any of the search words (case insensitive)
  const regex = new RegExp(`(${searchWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = searchWords.some(word =>
          part.toLowerCase().includes(word.toLowerCase())
        )

        return isMatch ? (
          <mark key={index} className={cn(highlightClassName)}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}

interface SearchResultItemProps {
  children: ReactNode
  searchTerm?: string
  className?: string
}

/**
 * Wrapper component that highlights search terms in all text content
 */
export function SearchResultItem({
  children,
  searchTerm,
  className
}: SearchResultItemProps) {
  if (!searchTerm?.trim()) {
    return <div className={className}>{children}</div>
  }

  // This is a simplified version - in a real implementation,
  // you'd want to recursively highlight text in all child elements
  return (
    <div className={className}>
      {children}
    </div>
  )
}

/**
 * Hook to highlight search terms in text
 */
export function useSearchHighlight(searchTerm?: string) {
  const highlight = (text: string, customClassName?: string) => (
    <SearchHighlighter
      text={text}
      searchTerm={searchTerm || ''}
      highlightClassName={customClassName}
    />
  )

  return { highlight }
}
