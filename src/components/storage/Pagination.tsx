'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import type { PaginationProps } from './types'

export const Pagination: React.FC<PaginationProps> = ({
  mode,
  currentPage,
  totalPages,
  onPageChange,
  hasMore,
  onLoadMore,
  isLoading = false,
}) => {
  if (mode === 'loadmore') {
    if (!hasMore) return null

    return (
      <div className="flex justify-center mt-6">
        <Button
          onClick={onLoadMore}
          disabled={isLoading}
          variant="outline"
          size="lg"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </Button>
      </div>
    )
  }

  // Pages mode
  if (!totalPages || totalPages <= 1) return null

  const current = currentPage ?? 1
  const total = totalPages

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    if (total > 1) {
      pages.push(total)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange?.(current - 1)}
        disabled={current === 1 || isLoading}
        aria-label="Previous page"
      >
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            )
          }

          return (
            <Button
              key={page}
              variant={current === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange?.(page as number)}
              disabled={isLoading}
              aria-label={`Page ${page}`}
              aria-current={current === page ? 'page' : undefined}
              className="min-w-[2.5rem]"
            >
              {page}
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange?.(current + 1)}
        disabled={current === total || isLoading}
        aria-label="Next page"
      >
        Next
      </Button>
    </div>
  )
}


