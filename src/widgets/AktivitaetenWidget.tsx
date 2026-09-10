import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { pagesFromAll, usePagedList } from '../hooks/usePagedList'
import { daysBetween, formatDate, toCalendarDate, type Urgency } from '../lib/format'
import { listMyOpenTodos, type TodoRow } from '../services/todo'

interface TodoItem extends TodoRow {
  /** Tage bis zur Fälligkeit, zum Ladezeitpunkt berechnet */
  dueInDays: number | null
}

// Der To-Do-Connector kann nicht blättern - einmal laden, stapelweise anzeigen.
const loadTodos = pagesFromAll(async (): Promise<TodoItem[]> => {
  const rows = await listMyOpenTodos()
  const today = new Date()
  return rows.map((todo) => {
    const due = toCalendarDate(todo.dueDate)
    return { ...todo, dueInDays: due ? daysBetween(today, due) : null }
  })
}, 10)

function todoUrgency(todo: TodoItem): Urgency {
  if (todo.dueInDays !== null && todo.dueInDays < 0) return 'critical'
  if (todo.dueInDays === 0 || todo.importance === 'high') return 'warning'
  return 'normal'
}

function DueLabel({ todo }: { todo: TodoItem }) {
  if (todo.dueInDays === null) return null
  if (todo.dueInDays < 0) return <Pill tone="critical">überfällig · {formatDate(todo.dueDate)}</Pill>
  if (todo.dueInDays === 0) return <Pill tone="warning">heute fällig</Pill>
  return <Pill tone="neutral">fällig {formatDate(todo.dueDate)}</Pill>
}

// Live-Widget: offene Aufgaben aus allen eigenen Microsoft To-Do-Listen, Überfälliges und bald Fälliges zuerst.
export default function AktivitaetenWidget(props: WidgetProps) {
  const list = usePagedList(loadTodos)
  const overdue = list.items.filter((todo) => todo.dueInDays !== null && todo.dueInDays < 0).length

  return (
    <WidgetFrame {...props} badge={list.status === 'ready' && overdue > 0 ? <Pill tone="critical">{overdue} überfällig</Pill> : undefined}>
      <PagedRows
        list={list}
        empty="Keine offenen Aufgaben"
        renderItem={(todo) => (
          <Row
            key={todo.id}
            urgency={todoUrgency(todo)}
            title={todo.title}
            meta={`${todo.list} · ${todo.statusLabel}`}
            tags={todo.importance === 'high' ? <Pill tone="critical">Wichtig</Pill> : undefined}
            aside={<DueLabel todo={todo} />}
          />
        )}
      />
    </WidgetFrame>
  )
}
