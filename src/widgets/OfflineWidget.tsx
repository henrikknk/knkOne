import { WidgetFrame, WidgetNotice } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'

// Platzhalter für Widgets, deren Quelle noch nicht angebunden ist.
export default function OfflineWidget(props: WidgetProps) {
  return (
    <WidgetFrame {...props}>
      <WidgetNotice kind="offline" text={`Für „${props.widget.source}“ ist noch keine Datenquelle angebunden.`} />
    </WidgetFrame>
  )
}
