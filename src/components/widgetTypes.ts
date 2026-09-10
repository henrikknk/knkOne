import type { Urgency } from '../lib/format'

export interface WidgetDef {
  id: string
  title: string
  source: string
  /** Kurzzeichen der Quelle im Widget-Kopf */
  sourceShort: string
  /** Erkennungsfarbe der Quelle */
  color: string
}

export interface WidgetProps {
  widget: WidgetDef
  editing: boolean
  dragging: boolean
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
