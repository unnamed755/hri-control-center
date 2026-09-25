import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import { SkeletonTable } from './Skeleton'
import { ErrorState, NoResults, RefetchBar } from './States'
import { Pagination } from './Pagination'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

/**
 * The table used by every module page.
 *
 * columns: [{ key, label, align, width, sortable, render(row, index), hideBelow }]
 * Sorting, pagination and filtering are owned by the caller (useTableState) and
 * executed by the service, so the same props work against a real API tomorrow.
 */
export const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  refetching = false,
  error = null,
  onRetry,
  sort = { by: null, dir: 'asc' },
  onSort,
  onRowClick,
  rowKey = (row, index) => row.id ?? row.key ?? index,
  emptyState,
  query,
  onResetFilters,
  pagination,
  className,
  dense = false,
  footer,
  stickyHeader = true,
}) => {
  const showSkeleton = loading && !rows.length
  const showEmpty = !loading && !error && rows.length === 0

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <RefetchBar active={refetching} />
      <div className="scroll-area relative min-h-0 flex-1 overflow-auto">
        {showSkeleton ? (
          <SkeletonTable rows={8} columns={Math.min(columns.length, 7)} />
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : showEmpty ? (
          emptyState ?? <NoResults query={query} onReset={onResetFilters} />
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
              <tr>
                {columns.map((column) => {
                  const active = sort.by === column.key
                  const sortable = column.sortable !== false && Boolean(onSort) && column.key
                  const SortIcon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown
                  return (
                    <th
                      key={column.key ?? column.label}
                      style={{ width: column.width }}
                      className={cn(
                        'border-b border-line bg-surface-2/95 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] backdrop-blur',
                        active ? 'text-ink-2' : 'text-subtle',
                        ALIGN[column.align ?? 'left'],
                        column.hideBelow === 'lg' && 'hidden lg:table-cell',
                        column.hideBelow === 'xl' && 'hidden xl:table-cell',
                        column.hideBelow === 'md' && 'hidden md:table-cell',
                        column.headerClassName,
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => onSort(column.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 transition-colors hover:text-ink',
                            column.align === 'right' && 'flex-row-reverse',
                          )}
                        >
                          {column.label}
                          <SortIcon
                            className={cn('size-3', active ? 'text-brand-2' : 'text-faint')}
                            strokeWidth={2.4}
                          />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/*
                Rows animate in only. Exit animations inside <tbody> are
                deliberately avoided: a row that never finishes exiting would
                stay in the DOM and make a filtered table look wrong.
              */}
              {rows.map((row, index) => (
                  <motion.tr
                    key={rowKey(row, index)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.22, ease: EASE, delay: Math.min(index, 12) * 0.016 },
                    }}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'group transition-colors duration-150',
                      onRowClick && 'cursor-pointer',
                      'hover:bg-white/[0.028]',
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key ?? column.label}
                        className={cn(
                          'border-b border-line-soft/70 px-4 align-middle text-[12.5px] text-ink-2',
                          dense ? 'py-2' : 'py-3',
                          ALIGN[column.align ?? 'left'],
                          column.hideBelow === 'lg' && 'hidden lg:table-cell',
                          column.hideBelow === 'xl' && 'hidden xl:table-cell',
                          column.hideBelow === 'md' && 'hidden md:table-cell',
                          column.className,
                        )}
                      >
                        {column.render ? column.render(row, index) : (row[column.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                ))}
            </tbody>
            {footer && <tfoot>{footer}</tfoot>}
          </table>
        )}
      </div>
      {pagination && !showSkeleton && !error && rows.length > 0 && <Pagination {...pagination} />}
    </div>
  )
}
