import type { Urgency } from '../lib/format'

export interface WidgetDef {
  id: string
  title: string
  source: string
  /** Logo der Anwendung bzw. passendes Symbol im Widget-Kopf (Bild-URL) */
  icon: string
  /** Erkennungsfarbe der Quelle */
  color: string
}

/** Anzahl Spalten bzw. Zeilen, die ein Widget im Raster belegt */
export type WidgetSpan = 1 | 2

export interface WidgetSize {
  cols: WidgetSpan
  rows: WidgetSpan
}

export interface WidgetProps {
  widget: WidgetDef
  editing: boolean
  dragging: boolean
  size: WidgetSize
  onResize: (size: WidgetSize) => void
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
}

export type Tone = 'critical' | 'warning' | 'success' | 'info' | 'neutral'

export function toneForUrgency(urgency: Urgency): Tone {
  if (urgency === 'critical') return 'critical'
  if (urgency === 'warning') return 'warning'
  return 'neutral'
}
