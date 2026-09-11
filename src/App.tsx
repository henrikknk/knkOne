import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'
import knkLogo from './assets/knk-logo.jpg'
// Logos der Anwendungen (Icons der Power-Platform-Connectoren); ohne eigene Anwendung ein passendes Symbol.
import businessCentralIcon from './assets/sources/business-central.png'
import confluenceIcon from './assets/sources/confluence.png'
import copilotStudioIcon from './assets/sources/copilot-studio.png'
import dynamicsIcon from './assets/sources/dynamics-365.png'
import jiraIcon from './assets/sources/jira.png'
import outlookIcon from './assets/sources/outlook.png'
import signalsIcon from './assets/sources/signals.svg'
import teamsIcon from './assets/sources/teams.png'
import todoIcon from './assets/sources/todo.png'
import workloadIcon from './assets/sources/workload.svg'
import GlobalSearch from './components/GlobalSearch'
import { useTheme, type Theme } from './hooks/useTheme'
import type { WidgetDef, WidgetProps, WidgetSize } from './components/widgetTypes'
import AktivitaetenWidget from './widgets/AktivitaetenWidget'
import AuslastungWidget from './widgets/AuslastungWidget'
import ConfluenceWidget from './widgets/ConfluenceWidget'
import KundensignaleWidget from './widgets/KundensignaleWidget'
import KundenticketsWidget from './widgets/KundenticketsWidget'
import OfflineWidget from './widgets/OfflineWidget'
import PowerPilotWidget from './widgets/PowerPilotWidget'
import ProjektbudgetsWidget from './widgets/ProjektbudgetsWidget'
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

type CatalogEntry = WidgetDef & {
  component: (props: WidgetProps) => ReactNode
  /** Größe, solange für die Rolle keine eigene gespeichert ist */
  defaultSize?: WidgetSize
}

const SOURCES = {
  dynamics: { source: 'Dynamics 365', icon: dynamicsIcon, color: '#004576' },
  jira: { source: 'Jira', icon: jiraIcon, color: '#0C66E4' },
  todo: { source: 'To-Do & Planner', icon: todoIcon, color: '#2564CF' },
  outlook: { source: 'Outlook', icon: outlookIcon, color: '#0F6CBD' },
  web: { source: 'Perplexity', icon: signalsIcon, color: '#1F7A8C' },
  confluence: { source: 'Confluence', icon: confluenceIcon, color: '#1868DB' },
  // Für NAV gibt es kein eigenes Connector-Logo mehr - Business Central ist der Nachfolger.
  nav: { source: 'NAV / Datasets', icon: businessCentralIcon, color: '#107C10' },
  teams: { source: 'Microsoft Teams', icon: teamsIcon, color: '#5B5FC7' },
  combined: { source: 'Jira · Dynamics 365 · To-Do · Planner', icon: workloadIcon, color: '#004576' },
  erp: { source: 'Business Central', icon: businessCentralIcon, color: '#00807F' },
  copilot: { source: 'Copilot Studio', icon: copilotStudioIcon, color: '#0F7B6C' },
} satisfies Record<string, Omit<WidgetDef, 'id' | 'title'>>

const CATALOG: CatalogEntry[] = [
  { id: 'auslastung', title: 'Auslastung', ...SOURCES.combined, component: AuslastungWidget },
  { id: 'projektbudgets', title: 'Projektbudgets', ...SOURCES.erp, defaultSize: { cols: 2, rows: 1 }, component: ProjektbudgetsWidget },
  { id: 'vertragsuebersicht', title: 'Vertragsübersicht', ...SOURCES.dynamics, component: VertragsuebersichtWidget },
  { id: 'vertriebsvorgaenge', title: 'Vertriebsvorgänge', ...SOURCES.dynamics, component: VertriebsvorgaengeWidget },
  { id: 'tickets', title: 'Tickets', ...SOURCES.jira, component: TicketsWidget },
  { id: 'kundentickets', title: 'Kundentickets', ...SOURCES.jira, defaultSize: { cols: 2, rows: 1 }, component: KundenticketsWidget },
  { id: 'aktivitaeten', title: 'Aktivitäten', ...SOURCES.todo, component: AktivitaetenWidget },
  // Die ID bleibt "kommunikation", damit gespeicherte Dashboard-Konfigurationen weiter passen.
  { id: 'kommunikation', title: 'Termine', ...SOURCES.outlook, component: TermineWidget },
  { id: 'kundensignale', title: 'Kundensignale', ...SOURCES.web, component: KundensignaleWidget },
  { id: 'kundenhistorie', title: 'Kundenhistorie', ...SOURCES.dynamics, component: OfflineWidget },
  { id: 'umsaetze', title: 'Umsätze', ...SOURCES.nav, component: OfflineWidget },
  { id: 'confluence', title: 'Confluence', ...SOURCES.confluence, component: ConfluenceWidget },
  { id: 'powerpilot', title: 'PowerPilot', ...SOURCES.copilot, defaultSize: { cols: 1, rows: 2 }, component: PowerPilotWidget },
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
    widgets: ['projektbudgets', 'tickets', 'aktivitaeten', 'confluence', 'kundenhistorie', 'teams'],
  },
  {
    id: 'consulting',
    name: 'Consulting-Team',
    desc: 'Tagessätze, Kundenanpassungen und Termine im Beratungsalltag',
    widgets: ['kundentickets', 'vertragsuebersicht', 'confluence', 'aktivitaeten', 'tickets', 'teams'],
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

function ThemeSwitch({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dunkles Design"
      title={dark ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
      className="theme-switch"
      onClick={onToggle}
    >
      <span className="theme-switch-knob" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {dark ? (
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          )}
        </svg>
      </span>
    </button>
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
  const { theme, toggleTheme } = useTheme()
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
    const stored = sizes[roleId]?.[id] ?? CATALOG.find((entry) => entry.id === id)?.defaultSize
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
            <ThemeSwitch theme={theme} onToggle={toggleTheme} />
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
                    <img className="widget-source" src={entry.icon} alt="" />
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
