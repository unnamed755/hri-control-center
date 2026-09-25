import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { Button, IconButton } from './Button'

const pageWindow = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages]
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, '…', page - 1, page, page + 1, '…', pages]
}

export const Pagination = ({ page = 1, pages = 1, total = 0, perPage = 12, onChange, className, label = 'yozuv' }) => {
  if (!total) return null
  const from = (page - 1) * perPage + 1
  const to = Math.min(total, page * perPage)

  return (
    <div
      className={cn(
        'flex flex-col-reverse items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-[12px] text-subtle tabular">
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)} {label}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="icon-sm"
            icon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            aria-label="Oldingi sahifa"
          />
          {pageWindow(page, pages).map((entry, index) =>
            entry === '…' ? (
              <span key={`gap-${index}`} className="px-1 text-[12px] text-subtle">
                …
              </span>
            ) : (
              <Button
                key={entry}
                size="num"
                variant={entry === page ? 'primary' : 'ghost'}
                onClick={() => onChange(entry)}
                className="tabular"
              >
                {entry}
              </Button>
            ),
          )}
          <IconButton
            variant="ghost"
            size="icon-sm"
            icon={ChevronRight}
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
            aria-label="Keyingi sahifa"
          />
        </div>
      )}
    </div>
  )
}
