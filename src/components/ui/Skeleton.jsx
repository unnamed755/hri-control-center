import { cn } from '@/lib/utils'

export const Skeleton = ({ className, rounded = 'rounded-[8px]', style }) => (
  <div className={cn('relative overflow-hidden bg-surface-3/70', rounded, className)} style={style}>
    <div className="skeleton-sheen absolute inset-0" />
  </div>
)

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
)

export const SkeletonStatCards = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="panel p-[18px]">
        <div className="flex items-start justify-between">
          <div className="w-full space-y-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="size-10 shrink-0" rounded="rounded-[11px]" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable = ({ rows = 8, columns = 6, withHeader = true }) => (
  <div className="w-full">
    {withHeader && (
      <div className="flex gap-4 border-b border-line-soft px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" />
        ))}
      </div>
    )}
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line-soft/60 px-4 py-3.5">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="flex flex-1 items-center gap-2.5">
              {c === 0 && <Skeleton className="size-8 shrink-0" rounded="rounded-full" />}
              <Skeleton className={cn('h-3', c === 0 ? 'w-full' : c % 2 ? 'w-3/4' : 'w-1/2')} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)

/** Fixed height pattern — a calm silhouette, not random noise. */
const CHART_PATTERN = [42, 58, 50, 72, 64, 86, 74, 92, 68, 80, 56, 70, 62, 88]

export const SkeletonChart = ({ height = 240, bars = 12 }) => (
  <div className="flex items-end gap-2" style={{ height }}>
    {Array.from({ length: bars }).map((_, i) => (
      <div key={i} className="flex h-full flex-1 items-end">
        <Skeleton
          className="w-full"
          rounded="rounded-t-[6px]"
          style={{ height: `${CHART_PATTERN[i % CHART_PATTERN.length]}%` }}
        />
      </div>
    ))}
  </div>
)

export const SkeletonList = ({ rows = 5, className }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
)
