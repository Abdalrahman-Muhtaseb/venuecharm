'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

interface VenuePaginationProps {
  currentPage: number
  totalPages: number
  locale: Locale
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const left  = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  const pages: (number | '…')[] = [1]
  if (left > 2)          pages.push('…')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export function VenuePagination({ currentPage, totalPages, locale }: VenuePaginationProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isHe = locale === 'he'

  if (totalPages <= 1) return null

  function href(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    return `${pathname}?${params.toString()}`
  }

  const pages = buildPages(currentPage, totalPages)
  const btnBase = 'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors'

  return (
    <nav
      aria-label={isHe ? 'ניווט בין עמודים' : 'Pagination'}
      dir="ltr"
      className="mt-10 flex items-center justify-center gap-0.5"
    >
      {currentPage === 1 ? (
        <span className={`${btnBase} cursor-not-allowed opacity-30`} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : (
        <Link href={href(currentPage - 1)} aria-label={isHe ? 'עמוד קודם' : 'Previous page'} className={`${btnBase} hover:bg-muted`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className={`${btnBase} cursor-default text-muted-foreground`} aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-label={`${isHe ? 'עמוד' : 'Page'} ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`${btnBase} ${
              p === currentPage
                ? 'bg-foreground text-background'
                : 'hover:bg-muted'
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage === totalPages ? (
        <span className={`${btnBase} cursor-not-allowed opacity-30`} aria-disabled="true">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : (
        <Link href={href(currentPage + 1)} aria-label={isHe ? 'עמוד הבא' : 'Next page'} className={`${btnBase} hover:bg-muted`}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
