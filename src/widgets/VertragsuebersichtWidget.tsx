import { useState } from 'react'
import { ChartFrame, ColumnChart, type ChartColumn, type ChartSeries } from '../components/charts'
import { ChartToggle, PagedRows, Pill, Row, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import { toneForUrgency, type WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { pagesFromAll, usePagedList } from '../hooks/usePagedList'
import { monthOffset, startOfDay } from '../lib/chartData'
import { daysBetween, deadlineUrgency, formatDate, relativeDays } from '../lib/format'
import {
  contractDeadlines,
  listActiveContracts,
  prioritizeContracts,
  type ContractRow,
  type PrioritizedContract,
} from '../services/contracts'

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

const MONTHS_AHEAD = 12
// Eine Serie ohne Identitätsanspruch - in der Grundfarbe statt einer Datenart-Farbe.
const DEADLINE_SERIES: ChartSeries[] = [{ id: 'deadlines', label: 'Fristen', color: 'var(--brand)' }]
const DEADLINE_KINDS = [
  { label: 'Kündigungsfristen', pattern: /^Kündigungsfrist/ },
  { label: 'Laufzeit- und Vertragsenden', pattern: /^(Mindestlaufzeit|Vertragsende)/ },
  { label: 'Preisschutz und Konditionen', pattern: /^(Preisschutz|Konditionsänderung)/ },
]

async function loadContractsForChart() {
  return { contracts: await listActiveContracts(), today: startOfDay(new Date()) }
}

/** Anstehende Fristen aller aktiven Verträge je Monat, mit Aufschlüsselung nach Art. */
function deadlineColumns(contracts: ContractRow[], today: Date) {
  const columns = Array.from({ length: MONTHS_AHEAD }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() + index, 1)
    return {
      key: `month-${index}`,
      label: month.toLocaleDateString('de-DE', { month: 'short' }),
      detail: month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      values: { deadlines: 0 },
      kinds: DEADLINE_KINDS.map(() => 0),
    }
  })
  for (const contract of contracts) {
    for (const deadline of contractDeadlines(contract)) {
      const offset = monthOffset(today, deadline.date)
      if (deadline.date < today || offset >= MONTHS_AHEAD) continue
      columns[offset].values.deadlines += 1
      const kind = DEADLINE_KINDS.findIndex((entry) => entry.pattern.test(deadline.label))
      if (kind >= 0) columns[offset].kinds[kind] += 1
    }
  }
  return columns
}

// Diagramm: wie viele Fristen in den nächsten zwölf Monaten anstehen.
function ContractsChart() {
  const data = useAsyncData(loadContractsForChart)

  if (data.status === 'loading') return <WidgetSkeleton />
  if (data.status === 'error') return <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />
  if (data.data.contracts.length === 0) return <WidgetEmpty text="Keine aktiven Verträge" />

  const months = deadlineColumns(data.data.contracts, data.data.today)
  const columns: ChartColumn[] = months.map(({ kinds, ...month }) => ({
    ...month,
    notes: DEADLINE_KINDS.flatMap((kind, index) => (kinds[index] > 0 ? [`${kinds[index]} ${kind.label}`] : [])),
  }))
  return (
    <ChartFrame
      caption="Anstehende Fristen aller aktiven Verträge je Monat"
      table={{
        columns: ['Monat', 'Fristen', ...DEADLINE_KINDS.map((kind) => kind.label)],
        rows: months.map((month) => ({ key: month.key, cells: [month.detail, month.values.deadlines, ...month.kinds] })),
      }}
    >
      <ColumnChart series={DEADLINE_SERIES} columns={columns} integer ariaLabel="Anstehende Vertragsfristen je Monat" />
    </ChartFrame>
  )
}

// Live-Widget: aktive Verträge aus der knk365-Verträge-App (Dataverse), priorisiert nach der nächsten auslaufenden Frist.
export default function VertragsuebersichtWidget(props: WidgetProps) {
  const list = usePagedList(loadContracts)
  const [showChart, setShowChart] = useState(false)
  const critical = list.items.filter((item) => item.daysLeft !== null && item.daysLeft <= 30).length

  return (
    <WidgetFrame
      {...props}
      actions={<ChartToggle active={showChart} onToggle={() => setShowChart((value) => !value)} />}
      badge={list.status === 'ready' && critical > 0 ? <Pill tone="critical">{critical} ≤ 30 Tage</Pill> : undefined}
    >
      {showChart ? (
        <ContractsChart />
      ) : (
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
      )}
    </WidgetFrame>
  )
}
