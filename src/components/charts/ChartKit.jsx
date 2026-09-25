import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import { formatCompact, formatNumber } from '@/lib/format'

/* ------------------------------------------------------------------ */
/* Shared theme                                                        */
/* ------------------------------------------------------------------ */

export const CHART_COLORS = [
  'var(--color-brand)',
  'var(--color-teal)',
  'var(--color-violet)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-amber)',
  'var(--color-danger)',
]

const AXIS = {
  stroke: 'transparent',
  tick: { fill: 'var(--color-subtle)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
}

const GRID = {
  stroke: 'rgba(255,255,255,0.055)',
  strokeDasharray: '3 5',
  vertical: false,
}

const ANIM = { duration: 950, easing: 'ease-out' }

/** Long category labels (department names) must not collide on the X axis. */
const truncateTick = (value) =>
  typeof value === 'string' && value.length > 12 ? `${value.slice(0, 11)}…` : value

export const ChartTooltip = ({ active, payload, label, labelFormatter, valueFormatter, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pointer-events-none min-w-[140px] rounded-[10px] border border-line-strong bg-surface-3/97 px-3 py-2.5 shadow-float backdrop-blur-xl">
      {label !== undefined && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.payload?.fill ?? 'var(--color-brand)' }}
              />
              {entry.name}
            </span>
            <span className="text-[12px] font-semibold text-ink tabular">
              {valueFormatter ? valueFormatter(entry.value) : formatNumber(entry.value)}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ChartLegend = ({ items = [], className }) => (
  <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
    {items.map((item) => (
      <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-muted">
        <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
        {item.label}
        {item.value !== undefined && <span className="font-semibold text-ink-2 tabular">{item.value}</span>}
      </span>
    ))}
  </div>
)

/* ------------------------------------------------------------------ */
/* Area / line trends                                                  */
/* ------------------------------------------------------------------ */

export const AreaTrend = ({
  data = [],
  xKey = 'month',
  series = [{ key: 'value', label: 'Qiymat', color: 'var(--color-brand)' }],
  height = 230,
  xFormatter,
  valueFormatter,
  yFormatter = formatCompact,
  stacked = false,
  showGrid = true,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -12 }}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.34} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
          </linearGradient>
        ))}
      </defs>
      {showGrid && <CartesianGrid {...GRID} />}
      <XAxis dataKey={xKey} {...AXIS} tickFormatter={xFormatter} dy={6} />
      <YAxis {...AXIS} tickFormatter={yFormatter} width={48} />
      <Tooltip
        cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={valueFormatter} />}
      />
      {series.map((s) => (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          strokeWidth={2}
          fill={`url(#grad-${s.key})`}
          stackId={stacked ? 'a' : undefined}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface)' }}
          animationDuration={ANIM.duration}
          animationEasing={ANIM.easing}
        />
      ))}
    </AreaChart>
  </ResponsiveContainer>
)

export const LineTrend = ({
  data = [],
  xKey = 'month',
  series = [{ key: 'value', label: 'Qiymat', color: 'var(--color-brand)' }],
  height = 230,
  xFormatter,
  valueFormatter,
  yFormatter = formatCompact,
  domain,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <CartesianGrid {...GRID} />
      <XAxis dataKey={xKey} {...AXIS} tickFormatter={xFormatter} dy={6} />
      <YAxis {...AXIS} tickFormatter={yFormatter} width={44} domain={domain} />
      <Tooltip
        cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={valueFormatter} />}
      />
      {series.map((s) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          strokeWidth={2.2}
          dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
          animationDuration={ANIM.duration}
          animationEasing={ANIM.easing}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
)

/* ------------------------------------------------------------------ */
/* Bars                                                                */
/* ------------------------------------------------------------------ */

export const BarCompare = ({
  data = [],
  xKey = 'name',
  series = [{ key: 'value', label: 'Qiymat', color: 'var(--color-brand)' }],
  height = 230,
  stacked = false,
  xFormatter,
  valueFormatter,
  yFormatter = formatCompact,
  colorByPoint = false,
  barSize,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -12 }} barGap={4}>
      <CartesianGrid {...GRID} />
      <XAxis dataKey={xKey} {...AXIS} tickFormatter={xFormatter ?? truncateTick} dy={6} interval={0} />
      <YAxis {...AXIS} tickFormatter={yFormatter} width={46} />
      <Tooltip
        cursor={{ fill: 'rgba(255,255,255,0.035)' }}
        content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={valueFormatter} />}
      />
      {series.map((s) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label}
          fill={s.color}
          stackId={stacked ? 'a' : undefined}
          radius={stacked ? [0, 0, 0, 0] : [5, 5, 0, 0]}
          barSize={barSize}
          animationDuration={ANIM.duration}
          animationEasing={ANIM.easing}
        >
          {colorByPoint &&
            data.map((entry, index) => (
              <Cell key={index} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
        </Bar>
      ))}
    </BarChart>
  </ResponsiveContainer>
)

/** Animated horizontal ranking bars — lighter than a chart for dense lists. */
export const RankBars = ({ data = [], valueFormatter = formatNumber, max, className, onSelect }) => {
  const peak = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('space-y-2.5', className)}>
      {data.map((item, index) => (
        <div
          key={item.name}
          className={cn('group', onSelect && 'cursor-pointer')}
          onClick={() => onSelect?.(item)}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-[12px] text-ink-2">{item.name}</span>
            <span className="shrink-0 text-[12px] font-semibold text-ink tabular">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.055]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / peak) * 100}%` }}
              transition={{ duration: 0.8, ease: EASE, delay: index * 0.045 }}
            />
          </div>
          {item.hint && <p className="mt-1 text-[11px] text-subtle">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export const DonutChart = ({
  data = [],
  height = 210,
  innerRadius = 62,
  outerRadius = 88,
  centerValue,
  centerLabel,
  valueFormatter = formatNumber,
  nameKey = 'name',
  dataKey = 'value',
}) => (
  <div className="relative" style={{ height }}>
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          stroke="var(--color-surface)"
          strokeWidth={2}
          animationDuration={ANIM.duration}
          animationEasing={ANIM.easing}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
      </PieChart>
    </ResponsiveContainer>
    {(centerValue !== undefined || centerLabel) && (
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-[21px] font-semibold tracking-[-0.02em] text-ink tabular">{centerValue}</p>
          {centerLabel && (
            <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.1em] text-subtle">{centerLabel}</p>
          )}
        </div>
      </div>
    )}
  </div>
)

/* ------------------------------------------------------------------ */
/* Funnel (custom, animated)                                           */
/* ------------------------------------------------------------------ */

export const FunnelStages = ({ data = [], valueFormatter = formatNumber, className, onSelect }) => {
  const peak = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('space-y-2', className)}>
      {data.map((stage, index) => {
        const width = Math.max(8, (stage.value / peak) * 100)
        const prev = index > 0 ? data[index - 1].value : null
        const drop = prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null
        return (
          <div
            key={stage.key ?? stage.label}
            className={cn('group relative', onSelect && 'cursor-pointer')}
            onClick={() => onSelect?.(stage)}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[12px] text-ink-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.label}
              </span>
              <span className="flex items-center gap-2">
                {drop !== null && <span className="text-[11px] text-subtle tabular">{drop}%</span>}
                <span className="text-[12.5px] font-semibold text-ink tabular">{valueFormatter(stage.value)}</span>
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-[7px] bg-white/[0.035]">
              <motion.div
                className="h-full rounded-[7px] transition-opacity duration-200 group-hover:opacity-90"
                style={{
                  background: `linear-gradient(90deg, ${stage.color} 0%, color-mix(in oklab, ${stage.color} 55%, transparent) 100%)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.85, ease: EASE, delay: index * 0.07 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Radar + sparkline                                                   */
/* ------------------------------------------------------------------ */

export const RadarCompare = ({ data = [], series = [], height = 250, angleKey = 'metric' }) => (
  <ResponsiveContainer width="100%" height={height}>
    <RadarChart data={data} outerRadius="72%">
      <PolarGrid stroke="rgba(255,255,255,0.08)" />
      <PolarAngleAxis dataKey={angleKey} tick={{ fill: 'var(--color-subtle)', fontSize: 10.5 }} />
      <Tooltip content={<ChartTooltip />} />
      {series.map((s) => (
        <Radar
          key={s.key}
          name={s.label}
          dataKey={s.key}
          stroke={s.color}
          fill={s.color}
          fillOpacity={0.16}
          strokeWidth={2}
          animationDuration={ANIM.duration}
        />
      ))}
    </RadarChart>
  </ResponsiveContainer>
)

export const Sparkline = ({ data = [], dataKey = 'value', color = 'var(--color-brand)', height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id={`spark-${dataKey}-${color.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={1.8}
        fill={`url(#spark-${dataKey}-${color.replace(/\W/g, '')})`}
        dot={false}
        animationDuration={800}
      />
    </AreaChart>
  </ResponsiveContainer>
)
