import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { budgetState } from '../lib/chartData'
import { Pill } from './Widget'

// Schlanke SVG-Diagramme: dünne Marken, feine Raster, Tooltip per Zeiger und Tastatur,
// Legende ab zwei Serien und eine Tabellenansicht als barrierefreie Alternative.

export interface ChartSeries {
  id: string
  label: string
  /** CSS-Farbe, in der Regel eine Serienvariable wie var(--series-1) */
  color: string
}

export interface ChartTableData {
  columns: string[]
  rows: Array<{ key: string; cells: Array<string | number> }>
}

const formatNumber = (value: number) => value.toLocaleString('de-DE')

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

/** Runde Achsenwerte von 0 bis knapp über `max`. */
function niceTicks(max: number, integer: boolean): number[] {
  const target = max > 0 ? max : 1
  const rough = target / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const factors = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]
  const candidate = factors.map((factor) => factor * magnitude).find((step) => step >= rough) ?? 10 * magnitude
  const step = integer ? Math.max(1, candidate) : candidate
  return Array.from({ length: Math.ceil(target / step) + 1 }, (_, index) => Math.round(index * step * 1000) / 1000)
}

/** Rechteck mit gerundeten oberen Ecken - das Datenende; die Grundlinie bleibt eckig. */
function topRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
}

function Key({ color, shape = 'line' }: { color: string; shape?: 'line' | 'rect' }) {
  return <span className={`chart-key chart-key--${shape}`} style={{ '--key-color': color } as CSSProperties} aria-hidden="true" />
}

interface TooltipRow {
  key: string
  color: string
  value: string
  label: string
}

function Tooltip({ x, width, title, rows, notes = [], gap = 12 }: { x: number; width: number; title: string; rows: TooltipRow[]; notes?: string[]; gap?: number }) {
  // Auf der zur Mitte gewandten Seite, damit der Tooltip nie über den Rand ragt; `gap` hält Beschriftungen an der Marke frei.
  const position: CSSProperties = x < width / 2 ? { left: x + gap } : { right: width - x + gap }
  return (
    <div className="chart-tooltip" style={position} role="status">
      <div className="chart-tooltip-title">{title}</div>
      {rows.map((row) => (
        <div key={row.key} className="chart-tooltip-row">
          <Key color={row.color} />
          <strong>{row.value}</strong>
          <span>{row.label}</span>
        </div>
      ))}
      {notes.map((note, index) => (
        <div key={index} className="chart-tooltip-note">
          {note}
        </div>
      ))}
    </div>
  )
}

interface ChartFrameProps {
  /** Legende, erst ab zwei Serien sichtbar */
  legend?: ChartSeries[]
  legendShape?: 'line' | 'rect'
  /** Filter über dem Diagramm, z. B. Gruppierung */
  controls?: ReactNode
  caption?: string
  /** Tabellenansicht als Alternative zum Diagramm */
  table?: ChartTableData
  children: ReactNode
}

/** Rahmen um ein Diagramm: Filterzeile, Legende, Umschalter auf die Tabellenansicht und Bildunterschrift. */
export function ChartFrame({ legend, legendShape = 'line', controls, caption, table, children }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false)
  const showLegend = !showTable && legend !== undefined && legend.length > 1

  return (
    <div className="chart-view">
      {(controls || showLegend) && (
        <div className="chart-controls">
          {controls}
          {showLegend && (
            <ul className="chart-legend" aria-label="Legende">
              {legend.map((series) => (
                <li key={series.id}>
                  <Key color={series.color} shape={legendShape} />
                  {series.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {showTable && table ? (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={index}>{typeof cell === 'number' ? formatNumber(cell) : cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
      {/* Tabellen-Umschalter in der Fußzeile, damit die Legende oben auch in schmalen Widgets kompakt bleibt */}
      {(caption || table) && (
        <div className="chart-footer">
          {caption && <p className="chart-caption">{caption}</p>}
          {table && (
            <button type="button" className="btn btn--ghost btn--small chart-table-toggle" aria-pressed={showTable} onClick={() => setShowTable((value) => !value)}>
              {showTable ? 'Diagramm' : 'Tabelle'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export interface LinePoint {
  key: string
  /** Kurzbeschriftung an der x-Achse */
  label: string
  /** Ausführliche Beschriftung für den Tooltip */
  detail: string
  /** null = kein Wert, z. B. Abgerechnetes in der Zukunft - die Linie endet davor */
  values: Record<string, number | null>
}

interface LineChartProps {
  series: ChartSeries[]
  points: LinePoint[]
  ariaLabel: string
  /** Werte im Tooltip */
  formatValue?: (value: number) => string
  /** Achsenwerte und Endbeschriftungen, gern kompakt */
  formatTick?: (value: number) => string
  /** Senkrechte Markierung an einem Zeitpunkt, z. B. „heute“ */
  marker?: { index: number; label: string }
}

function hasValue(value: number | null | undefined): value is number {
  return typeof value === 'number'
}

/** Liniendiagramm mit einer y-Achse; Fadenkreuz und Tooltip zeigen alle Serien am gewählten Zeitpunkt. */
export function LineChart({ series, points, ariaLabel, formatValue = formatNumber, formatTick = formatNumber, marker }: LineChartProps) {
  const [plotRef, { width, height }] = useElementSize<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const last = points.length - 1
  const shown = active !== null && active <= last ? active : null

  const ticks = niceTicks(Math.max(0, ...points.flatMap((point) => series.map((item) => point.values[item.id] ?? 0))), true)
  const top = ticks[ticks.length - 1]
  const endLabels = width >= 440
  const tickLabelWidth = Math.max(...ticks.map((tick) => formatTick(tick).length)) * 6.2 + 12
  const margin = { top: 12, right: endLabels ? 124 : 16, bottom: 24, left: Math.max(36, tickLabelWidth) }
  const plotW = Math.max(1, width - margin.left - margin.right)
  const plotH = Math.max(1, height - margin.top - margin.bottom)
  const x = (index: number) => margin.left + (last <= 0 ? plotW / 2 : (index / last) * plotW)
  const y = (value: number) => margin.top + plotH - (value / top) * plotH
  const labelEvery = Math.max(1, Math.ceil(56 / (plotW / Math.max(1, last))))

  // Letzter vorhandener Wert je Serie - dort enden Linie, Punkt und Beschriftung.
  const lastIndex = (id: string) => {
    const defined = points.flatMap((point, index) => (hasValue(point.values[id]) ? [index] : []))
    return defined.length > 0 ? defined[defined.length - 1] : -1
  }
  // Lücken unterbrechen die Linie statt sie auf 0 fallen zu lassen.
  const linePath = (id: string) =>
    points
      .map((point, index) => {
        const value = point.values[id]
        if (!hasValue(value)) return ''
        return `${index > 0 && hasValue(points[index - 1].values[id]) ? 'L' : 'M'}${x(index)},${y(value)}`
      })
      .join(' ')

  // Endbeschriftungen nur, wenn alle Linien am rechten Rand enden und sich nicht überlappen -
  // sonst tragen Legende und Tooltip die Zuordnung.
  const ends = series
    .flatMap((item) => {
      const index = lastIndex(item.id)
      const value = index >= 0 ? points[index].values[item.id] : null
      return hasValue(value) ? [{ series: item, index, value, y: y(value) }] : []
    })
    .sort((a, b) => a.y - b.y)
  const endsCollide = ends.some((end, index) => end.index !== last || (index > 0 && end.y - ends[index - 1].y < 14))

  return (
    <div ref={plotRef} className="chart-plot">
      {width > 0 && height > 0 && points.length > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${ariaLabel}. Mit den Pfeiltasten durch die Zeitpunkte blättern.`}
          tabIndex={0}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const relative = (event.clientX - rect.left - margin.left) / plotW
            setActive(Math.min(last, Math.max(0, Math.round(relative * last))))
          }}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            const step = event.key === 'ArrowRight' ? 1 : -1
            setActive((current) => Math.min(last, Math.max(0, (current ?? last) + step)))
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line className={tick === 0 ? 'chart-baseline' : 'chart-grid'} x1={margin.left} x2={margin.left + plotW} y1={y(tick)} y2={y(tick)} />
              <text className="chart-tick" x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {formatTick(tick)}
              </text>
            </g>
          ))}
          {marker && marker.index >= 0 && marker.index <= last && (
            <g className="chart-marker" aria-hidden="true">
              <line x1={x(marker.index)} x2={x(marker.index)} y1={margin.top} y2={margin.top + plotH} />
              <text x={x(marker.index) + 4} y={margin.top + 10} textAnchor="start">
                {marker.label}
              </text>
            </g>
          )}
          {points.map((point, index) =>
            (last - index) % labelEvery === 0 ? (
              <text key={point.key} className="chart-tick" x={x(index)} y={height - 6} textAnchor={index === last ? 'end' : index === 0 ? 'start' : 'middle'}>
                {point.label}
              </text>
            ) : null,
          )}
          {shown !== null && <line className="chart-crosshair" x1={x(shown)} x2={x(shown)} y1={margin.top} y2={margin.top + plotH} />}
          {series.map((item) => (
            <path key={item.id} d={linePath(item.id)} fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {series.map((item) => {
            const index = shown ?? lastIndex(item.id)
            const value = index >= 0 ? points[index].values[item.id] : null
            return hasValue(value) ? <circle key={item.id} className="chart-dot" cx={x(index)} cy={y(value)} r={5} fill={item.color} /> : null
          })}
          {endLabels &&
            !endsCollide &&
            ends.map((end) => (
              <text key={end.series.id} className="chart-end-label" x={x(last) + 12} y={end.y} dy="0.32em">
                {`${end.series.label} ${formatTick(end.value)}`}
              </text>
            ))}
        </svg>
      )}
      {shown !== null && width > 0 && (
        <Tooltip
          x={x(shown)}
          width={width}
          title={points[shown].detail}
          rows={series.map((item) => {
            const value = points[shown].values[item.id]
            return { key: item.id, color: item.color, value: hasValue(value) ? formatValue(value) : '–', label: item.label }
          })}
        />
      )}
    </div>
  )
}

export interface ChartColumn {
  key: string
  /** Kurzbeschriftung an der x-Achse */
  label: string
  /** Ausführliche Beschriftung für Tooltip und Tabelle */
  detail: string
  notes?: string[]
  values: Record<string, number>
}

interface ColumnChartProps {
  series: ChartSeries[]
  columns: ChartColumn[]
  ariaLabel: string
  /** Werte im Tooltip */
  formatValue?: (value: number) => string
  /** Achsenwerte und Säulenbeschriftung, gern kompakt */
  formatTick?: (value: number) => string
  integer?: boolean
  /** Senkrechte Markierung vor der Säule `beforeIndex`, z. B. „heute“, mit Beschriftung links und rechts davon */
  marker?: { beforeIndex: number; before?: string; after?: string }
}

/** Säulendiagramm; mehrere Serien werden gestapelt, mit 2px Abstand zwischen den Segmenten. */
export function ColumnChart({ series, columns, ariaLabel, formatValue = formatNumber, formatTick = formatNumber, integer = false, marker }: ColumnChartProps) {
  const [plotRef, { width, height }] = useElementSize<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const count = columns.length
  const shown = active !== null && active < count ? active : null

  const totals = columns.map((column) => series.reduce((sum, item) => sum + (column.values[item.id] ?? 0), 0))
  const ticks = niceTicks(Math.max(0, ...totals), integer)
  const top = ticks[ticks.length - 1]
  const tickLabelWidth = Math.max(...ticks.map((tick) => formatTick(tick).length)) * 6.2 + 10
  const margin = { top: 18, right: 6, bottom: 24, left: Math.max(28, tickLabelWidth) }
  const plotW = Math.max(1, width - margin.left - margin.right)
  const plotH = Math.max(1, height - margin.top - margin.bottom)
  const band = plotW / Math.max(1, count)
  const barWidth = Math.min(24, band * 0.6)
  const labelEvery = Math.max(1, Math.ceil(40 / band))
  // Achsenbeschriftung ausdünnen: Markierung (z. B. „Heute“), erste und letzte Säule haben Vorrang;
  // die übrigen folgen im Raster ab der Markierung und halten Abstand zu den vorrangigen.
  const labelAnchor = marker?.beforeIndex ?? 0
  const farEnough = (index: number, other: number) => Math.abs(index - other) * band >= 40
  const priorityLabels = [marker?.beforeIndex, 0, count - 1]
    .filter((index): index is number => index !== undefined && index >= 0 && index < count)
    .reduce<number[]>((kept, index) => (kept.every((other) => farEnough(index, other)) ? [...kept, index] : kept), [])
  const showLabel = (index: number) =>
    priorityLabels.includes(index) ||
    ((((index - labelAnchor) % labelEvery) + labelEvery) % labelEvery === 0 && priorityLabels.every((other) => farEnough(index, other)))
  const markerX = marker ? margin.left + band * marker.beforeIndex : null
  const showCaps = band >= 44
  const y = (value: number) => margin.top + plotH - (value / top) * plotH
  const center = (index: number) => margin.left + band * (index + 0.5)

  return (
    <div ref={plotRef} className="chart-plot">
      {width > 0 && height > 0 && count > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${ariaLabel}. Mit den Pfeiltasten durch die Säulen blättern.`}
          tabIndex={0}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(0)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            const step = event.key === 'ArrowRight' ? 1 : -1
            setActive((current) => Math.min(count - 1, Math.max(0, (current ?? 0) + step)))
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line className={tick === 0 ? 'chart-baseline' : 'chart-grid'} x1={margin.left} x2={margin.left + plotW} y1={y(tick)} y2={y(tick)} />
              <text className="chart-tick" x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {formatTick(tick)}
              </text>
            </g>
          ))}
          {columns.map((column, index) => {
            const values = series.map((item) => column.values[item.id] ?? 0)
            const segments = series
              .map((item, seriesIndex) => ({ series: item, value: values[seriesIndex], from: values.slice(0, seriesIndex).reduce((sum, value) => sum + value, 0) }))
              .filter((segment) => segment.value > 0)
            const left = center(index) - barWidth / 2
            return (
              <g key={column.key} opacity={shown !== null && shown !== index ? 0.55 : 1}>
                {segments.map((segment, segmentIndex) => {
                  const segmentTop = y(segment.from + segment.value)
                  const segmentHeight = y(segment.from) - segmentTop - (segmentIndex > 0 ? 2 : 0)
                  if (segmentHeight <= 0) return null
                  return segmentIndex === segments.length - 1 ? (
                    <path key={segment.series.id} d={topRoundedRect(left, segmentTop, barWidth, segmentHeight, 4)} fill={segment.series.color} />
                  ) : (
                    <rect key={segment.series.id} x={left} y={segmentTop} width={barWidth} height={segmentHeight} fill={segment.series.color} />
                  )
                })}
                {showCaps && totals[index] > 0 && (
                  <text className="chart-cap-label" x={center(index)} y={y(totals[index]) - 6} textAnchor="middle">
                    {formatTick(totals[index])}
                  </text>
                )}
                {showLabel(index) && (
                  <text className="chart-tick" x={center(index)} y={height - 6} textAnchor="middle">
                    {column.label}
                  </text>
                )}
                <rect className="chart-hit" x={center(index) - band / 2} y={margin.top} width={band} height={plotH} onPointerEnter={() => setActive(index)} />
              </g>
            )
          })}
          {marker && markerX !== null && (
            <g className="chart-marker" aria-hidden="true">
              <line x1={markerX} x2={markerX} y1={margin.top - 14} y2={margin.top + plotH} />
              {marker.before && marker.beforeIndex > 0 && (
                <text x={markerX - 6} y={margin.top - 6} textAnchor="end">
                  {marker.before}
                </text>
              )}
              {marker.after && marker.beforeIndex < count && (
                <text x={markerX + 6} y={margin.top - 6} textAnchor="start">
                  {marker.after}
                </text>
              )}
            </g>
          )}
        </svg>
      )}
      {shown !== null && width > 0 && (
        <Tooltip
          x={center(shown)}
          width={width}
          gap={30}
          title={columns[shown].detail}
          rows={series.map((item) => ({ key: item.id, color: item.color, value: formatValue(columns[shown].values[item.id] ?? 0), label: item.label }))}
          notes={[...(series.length > 1 ? [`Summe: ${formatValue(totals[shown])}`] : []), ...(columns[shown].notes ?? [])]}
        />
      )}
    </div>
  )
}

/** Waagerechte Balken mit Wert am Balkenende - alle Werte sind sichtbar beschriftet. */
export function BarList({ items, color, ariaLabel, formatValue = formatNumber }: { items: Array<{ label: string; value: number }>; color: string; ariaLabel: string; formatValue?: (value: number) => string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="bar-list" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.label} className="bar-row">
          <span className="bar-label" title={item.label}>
            {item.label}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ '--bar-color': color, '--bar-share': item.value / max } as CSSProperties} />
            <span className="bar-value">{formatValue(item.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

interface BudgetMeterProps {
  label: string
  used: number
  budget: number
  /** Zeitlicher Soll-Anteil heute (0-1), null ohne Zeitbezug */
  expectedShare: number | null
  formatValue?: (value: number) => string
}

/**
 * Budgetausschöpfung als Balken: die Füllung trägt den Zustand (Grundfarbe, Warnung, kritisch), die Spur ist eine
 * hellere Stufe derselben Farbe; die Markierung zeigt das zeitliche Soll. Der Zustand steht zusätzlich als Text daneben.
 */
export function BudgetMeter({ label, used, budget, expectedShare, formatValue = formatNumber }: BudgetMeterProps) {
  const share = budget > 0 ? used / budget : 0
  const percent = Math.round(share * 100)
  const state = budgetState(used, budget, expectedShare)
  const statusLabel = state === 'over' ? 'Budget überschritten' : state === 'ahead' ? 'Über Plan' : 'Im Plan'
  const expectedPercent = expectedShare === null ? null : Math.round(Math.min(Math.max(expectedShare, 0), 1) * 100)
  return (
    <span className={`meter meter--${state}`}>
      <span className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="meter-value">
          <strong>{formatValue(used)}</strong> von {formatValue(budget)} · {percent} %
        </span>
      </span>
      <span
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${formatValue(used)} von ${formatValue(budget)}, ${percent} Prozent, ${statusLabel}`}
      >
        <span className="meter-fill" style={{ width: `${Math.min(share, 1) * 100}%` }} />
        {expectedPercent !== null && <span className="meter-expected" style={{ left: `${expectedPercent}%` }} />}
      </span>
      <span className="meter-foot">
        <Pill tone={state === 'over' ? 'critical' : state === 'ahead' ? 'warning' : 'success'}>{statusLabel}</Pill>
        {expectedPercent !== null && <span>Soll heute {expectedPercent} %</span>}
      </span>
    </span>
  )
}
