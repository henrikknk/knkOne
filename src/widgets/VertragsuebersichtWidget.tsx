import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import { toneForUrgency, type WidgetProps } from '../components/widgetTypes'
import { pagesFromAll, usePagedList } from '../hooks/usePagedList'
import { daysBetween, deadlineUrgency, formatDate, relativeDays } from '../lib/format'
import { listActiveContracts, prioritizeContracts, type PrioritizedContract } from '../services/contracts'

interface ContractItem extends PrioritizedContract {
  /** Tage bis zu den beiden festen Terminen, zum Ladezeitpunkt berechnet */
  minimumDurationInDays: number | null
  noticeByInDays: number | null
}

// Priorisierung braucht alle aktiven Verträge - einmal laden, stapelweise anzeigen.
const loadContracts = pagesFromAll(async (): Promise<ContractItem[]> => {
  const today = new Date()
  const rows = prioritizeContracts(await listActiveContracts(), today)
  return rows.map((row) => ({
    ...row,
    minimumDurationInDays: row.minimumDurationEnd ? daysBetween(today, row.minimumDurationEnd) : null,
    noticeByInDays: row.conditionChangeNoticeBy ? daysBetween(today, row.conditionChangeNoticeBy) : null,
  }))
}, 10)

function KeyDate({ label, date, days }: { label: string; date: Date | null; days: number | null }) {
  const state = date === null || days === null ? 'missing' : days < 0 ? 'past' : deadlineUrgency(days)
  return (
    <div className={`key-date key-date--${state}`}>
      <dt>{label}</dt>
      <dd>
        {date ? formatDate(date) : 'nicht gepflegt'}
        {date && days !== null && <span className="key-date-relative">{days < 0 ? 'abgelaufen' : relativeDays(days)}</span>}
      </dd>
    </div>
  )
}

// Live-Widget: aktive Verträge aus der knk365-Verträge-App (Dataverse), priorisiert nach der nächsten auslaufenden Frist.
export default function VertragsuebersichtWidget(props: WidgetProps) {
  const list = usePagedList(loadContracts)
  const critical = list.items.filter((item) => item.daysLeft !== null && item.daysLeft <= 30).length

  return (
    <WidgetFrame {...props} badge={list.status === 'ready' && critical > 0 ? <Pill tone="critical">{critical} ≤ 30 Tage</Pill> : undefined}>
      <PagedRows
        list={list}
        empty="Keine aktiven Verträge"
        renderItem={(item) => {
          const urgency = deadlineUrgency(item.daysLeft)
          return (
            <Row
              key={item.contract.id}
              urgency={urgency}
              title={item.contract.customer}
              meta={
                <>
                  {item.contract.number} · {item.contract.contractType}
                  {item.deadline && (
                    <>
                      {' · '}
                      <strong>{item.deadline.label}</strong>
                    </>
                  )}
                </>
              }
              tags={
                <dl className="key-dates">
                  <KeyDate label="Konditionsänderung ankündigen bis" date={item.conditionChangeNoticeBy} days={item.noticeByInDays} />
                  <KeyDate label="Mindestlaufzeit endet" date={item.minimumDurationEnd} days={item.minimumDurationInDays} />
                </dl>
              }
              aside={
                item.deadline && item.daysLeft !== null ? (
                  <Pill tone={toneForUrgency(urgency)} title={`${item.deadline.label}: ${formatDate(item.deadline.date)}`}>
                    {relativeDays(item.daysLeft)}
                  </Pill>
                ) : (
                  <Pill tone="neutral">keine Frist</Pill>
                )
              }
            />
          )
        }}
      />
    </WidgetFrame>
  )
}
