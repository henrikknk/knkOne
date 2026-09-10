import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import './App.css'
import knkLogo from './assets/knk-logo.jpg'
import GlobalSearch from './components/GlobalSearch'
import type { WidgetDef, WidgetProps, WidgetSize } from './components/widgetTypes'
import AktivitaetenWidget from './widgets/AktivitaetenWidget'
import AuslastungWidget from './widgets/AuslastungWidget'
import KundensignaleWidget from './widgets/KundensignaleWidget'
import OfflineWidget from './widgets/OfflineWidget'
import TermineWidget from './widgets/TermineWidget'
import TicketsWidget from './widgets/TicketsWidget'
import VertragsuebersichtWidget from './widgets/VertragsuebersichtWidget'
import VertriebsvorgaengeWidget from './widgets/VertriebsvorgaengeWidget'

interface RoleDef {
  id: string
  name: string
  desc: string
  widgets: string[]
}

type CatalogEntry = WidgetDef & { component: (props: WidgetProps) => ReactNode }

const SOURCES = {
  dynamics: { source: 'Dynamics 365', sourceShort: 'D365', color: '#004576' },
  jira: { source: 'Jira', sourceShort: 'JIRA', color: '#0C66E4' },
  todo: { source: 'To-Do & Planner', sourceShort: 'TODO', color: '#2564CF' },
  outlook: { source: 'Outlook', sourceShort: 'OL', color: '#0F6CBD' },
  web: { source: 'Perplexity', sourceShort: 'WEB', color: '#1F7A8C' },
  confluence: { source: 'Confluence', sourceShort: 'CNF', color: '#1868DB' },
  nav: { source: 'NAV / Datasets', sourceShort: 'NAV', color: '#107C10' },
  teams: { source: 'Microsoft Teams', sourceShort: 'TMS', color: '#5B5FC7' },
  combined: { source: 'Jira · Dynamics 365 · To-Do · Planner', sourceShort: 'ALLE', color: '#004576' },
} satisfies Record<string, Omit<WidgetDef, 'id' | 'title'>>

const CATALOG: CatalogEntry[] = [
  { id: 'auslastung', title: 'Auslastung', ...SOURCES.combined, component: AuslastungWidget },
  { id: 'vertragsuebersicht', title: 'Vertragsübersicht', ...SOURCES.dynamics, component: VertragsuebersichtWidget },
  { id: 'vertriebsvorgaenge', title: 'Vertriebsvorgänge', ...SOURCES.dynamics, component: VertriebsvorgaengeWidget },
  { id: 'tickets', title: 'Tickets', ...SOURCES.jira, component: TicketsWidget },
  { id: 'aktivitaeten', title: 'Aktivitäten', ...SOURCES.todo, component: AktivitaetenWidget },
  // Die ID bleibt "kommunikation", damit gespeicherte Dashboard-Konfigurationen weiter passen.
  { id: 'kommunikation', title: 'Termine', ...SOURCES.outlook, component: TermineWidget },
  { id: 'kundensignale', title: 'Kundensignale', ...SOURCES.web, component: KundensignaleWidget },
  { id: 'kundenhistorie', title: 'Kundenhistorie', ...SOURCES.dynamics, component: OfflineWidget },
  { id: 'umsaetze', title: 'Umsätze', ...SOURCES.nav, component: OfflineWidget },
  { id: 'confluence', title: 'Confluence', ...SOURCES.confluence, component: OfflineWidget },
  { id: 'teams', title: 'Teams-Aktivität', ...SOURCES.teams, component: OfflineWidget },
]

const ROLES: RoleDef[] = [
  {
    id: 'bestandskunden',
    name: 'Bestandskundenvertrieb',
    desc: 'Vertragslage, Umsätze und offene Vorgänge bestehender Kunden',
    widgets: ['aktivitaeten', 'tickets', 'kommunikation', 'kundensignale', 'vertriebsvorgaenge', 'vertragsuebersicht'],
  },
  {
    id: 'neukunden',
    name: 'Neukundenvertrieb',
    desc: 'Leads, Signale und Aktivitäten für die Neukundengewinnung',
    widgets: ['vertragsuebersicht', 'vertriebsvorgaenge', 'kundensignale', 'aktivitaeten', 'kommunikation'],
  },
  {
    id: 'projektleitung',
    name: 'Projektleitung',
    desc: 'Tickets, Aktivitäten und Kundenanpassungen laufender Projekte',
    widgets: ['tickets', 'aktivitaeten', 'confluence', 'kundenhistorie', 'teams'],
  },
  {
    id: 'consulting',
    name: 'Consulting-Team',
    desc: 'Tagessätze, Kundenanpassungen und Termine im Beratungsalltag',
    widgets: ['vertragsuebersicht', 'confluence', 'aktivitaeten', 'tickets', 'teams'],
  },
]

// v2: neue Standard-Anordnung - ältere, lokal gespeicherte Anordnungen würden sie sonst überdecken.
const STORAGE_KEY = 'knkone.dashboard.config.v2'
const SIZES_STORAGE_KEY = 'knkone.dashboard.sizes.v1'

/** Widget-Größen je Rolle und Widget; fehlende Einträge belegen 1 × 1 */
type SizeConfig = Record<string, Record<string, WidgetSize>>

function loadStored<T extends object>(key: string): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : ({} as T)
  } catch {
    return {} as T
  }
}

function saveStored(key: string, value: object) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function App() {
  const [roleId, setRoleId] = useState(ROLES[0].id)
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [config, setConfig] = useState<Record<string, string[]>>(() => loadStored(STORAGE_KEY))
  const [sizes, setSizes] = useState<SizeConfig>(() => loadStored(SIZES_STORAGE_KEY))
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragSource = useRef<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const doneButton = useRef<HTMLButtonElement>(null)
  const focusAfterToggle = useRef(false)

  useEffect(() => {
    saveStored(STORAGE_KEY, config)
  }, [config])

  // Der geklickte Knopf verschwindet beim Umschalten - Tastaturfokus auf sein Gegenstück setzen.
  useEffect(() => {
    if (!focusAfterToggle.current) return
    focusAfterToggle.current = false
    const target = editing ? doneButton.current : editButton.current
    target?.focus()
  }, [editing])

  useEffect(() => {
    saveStored(SIZES_STORAGE_KEY, sizes)
  }, [sizes])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0]
  const widgetIds = config[roleId] ?? role.widgets

  function widgetsForRole(id: string) {
    return config[id] ?? ROLES.find((r) => r.id === id)?.widgets ?? []
  }

  function updateWidgets(list: string[]) {
    setConfig((prev) => ({ ...prev, [roleId]: list }))
  }

  function sizeOf(id: string): WidgetSize {
    const stored = sizes[roleId]?.[id]
    return { cols: stored?.cols === 2 ? 2 : 1, rows: stored?.rows === 2 ? 2 : 1 }
  }

  function resizeWidget(id: string, size: WidgetSize) {
    setSizes((prev) => ({ ...prev, [roleId]: { ...prev[roleId], [id]: size } }))
  }

  function showToast(message: string) {
    // Neues Objekt, damit auch dieselbe Meldung zweimal hintereinander den Timer neu startet.
    setToast({ message })
  }

  function toggleEditing() {
    const next = !editing
    focusAfterToggle.current = true
    setEditing(next)
    showToast(next ? 'Bearbeiten: Widgets verschieben, an der Ecke vergrößern, entfernen oder hinzufügen' : 'Dashboard gespeichert')
  }

  function removeWidget(id: string) {
    updateWidgets(widgetIds.filter((x) => x !== id))
    setSizes((prev) => {
      const roleSizes = { ...prev[roleId] }
      delete roleSizes[id]
      return { ...prev, [roleId]: roleSizes }
    })
    const entry = CATALOG.find((c) => c.id === id)
    if (entry) showToast(`${entry.title} entfernt`)
  }

  function addWidget(id: string) {
    updateWidgets([...widgetIds, id])
    setPickerOpen(false)
    const entry = CATALOG.find((c) => c.id === id)
    if (entry) showToast(`${entry.title} hinzugefügt`)
  }

  function reorder(targetId: string) {
    const source = dragSource.current
    if (!source || source === targetId) return
    const ids = [...widgetIds]
    const from = ids.indexOf(source)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    updateWidgets(ids)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={knkLogo} alt="knk" width={40} height={40} />
          <div className="brand-text">
            <span className="brand-name">knkOne</span>
            <span className="brand-tagline">Vertrieb &amp; Projekte</span>
          </div>
        </div>

        <nav className="nav" aria-label="Rollen">
          <span className="nav-label">Rolle</span>
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`nav-item${r.id === roleId ? ' is-active' : ''}`}
              aria-current={r.id === roleId ? 'page' : undefined}
              onClick={() => setRoleId(r.id)}
            >
              <span className="nav-item-name">{r.name}</span>
              <span className="nav-item-count" aria-label={`${widgetsForRole(r.id).length} Widgets`}>
                {widgetsForRole(r.id).length}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="page-head">
          <div className="page-titles">
            <p className="eyebrow">{editing ? 'Dashboard bearbeiten' : 'Dashboard'}</p>
            <h1>{role.name}</h1>
            <p className="page-desc">{role.desc}</p>
          </div>
          <div className="page-actions">
            <GlobalSearch widgets={CATALOG} />
            {editing ? (
              <div className="btn-group" role="group" aria-label="Dashboard bearbeiten">
                <button className="btn btn--secondary" type="button" onClick={() => setPickerOpen(true)}>
                  <PlusIcon />
                  Widget hinzufügen
                </button>
                <button ref={doneButton} className="btn btn--primary" type="button" onClick={toggleEditing}>
                  <CheckIcon />
                  Fertig
                </button>
              </div>
            ) : (
              <button ref={editButton} className="btn btn--secondary" type="button" onClick={toggleEditing}>
                <PencilIcon />
                Bearbeiten
              </button>
            )}
          </div>
        </header>

        <div className="grid">
          {widgetIds.map((id) => {
            const entry = CATALOG.find((c) => c.id === id)
            if (!entry) return null
            const Widget = entry.component
            return (
              <Widget
                key={entry.id}
                widget={entry}
                editing={editing}
                dragging={draggingId === entry.id}
                size={sizeOf(entry.id)}
                onResize={(size) => resizeWidget(entry.id, size)}
                onRemove={() => removeWidget(entry.id)}
                onDragStart={() => {
                  dragSource.current = entry.id
                  setDraggingId(entry.id)
                }}
                onDragEnd={() => setDraggingId(null)}
                onDrop={() => reorder(entry.id)}
              />
            )
          })}
          {(editing || widgetIds.length === 0) && (
            <button className="add-widget" type="button" onClick={() => setPickerOpen(true)}>
              <PlusIcon />
              <span>Widget hinzufügen</span>
            </button>
          )}
        </div>
      </main>

      {pickerOpen && (
        <div
          className="backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPickerOpen(false)
          }}
        >
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="picker-title">
            <div className="dialog-head">
              <div>
                <h2 id="picker-title">Widget hinzufügen</h2>
                <p>Wähle ein Widget für das Dashboard „{role.name}“.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Schließen" autoFocus onClick={() => setPickerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="dialog-body">
              {CATALOG.map((entry) => {
                const added = widgetIds.includes(entry.id)
                return (
                  <button key={entry.id} type="button" className="catalog-item" disabled={added} onClick={() => addWidget(entry.id)}>
                    <span className="widget-source" style={{ '--source-color': entry.color } as CSSProperties} aria-hidden="true">
                      {entry.sourceShort}
                    </span>
                    <span className="catalog-text">
                      <b>{entry.title}</b>
                      <span>{entry.source}</span>
                    </span>
                    {added && <span className="catalog-added">Hinzugefügt</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast?.message}
      </div>
    </div>
  )
}

export default App
