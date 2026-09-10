import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import './App.css'
import knkLogo from './assets/knk-logo.jpg'
import type { WidgetDef, WidgetProps } from './components/widgetTypes'
import AktivitaetenWidget from './widgets/AktivitaetenWidget'
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
  todo: { source: 'Microsoft To-Do', sourceShort: 'TODO', color: '#2564CF' },
  outlook: { source: 'Outlook', sourceShort: 'OL', color: '#0F6CBD' },
  web: { source: 'Perplexity', sourceShort: 'WEB', color: '#1F7A8C' },
  confluence: { source: 'Confluence', sourceShort: 'CNF', color: '#1868DB' },
  nav: { source: 'NAV / Datasets', sourceShort: 'NAV', color: '#107C10' },
  teams: { source: 'Microsoft Teams', sourceShort: 'TMS', color: '#5B5FC7' },
} satisfies Record<string, Omit<WidgetDef, 'id' | 'title'>>

const CATALOG: CatalogEntry[] = [
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
    id: 'neukunden',
    name: 'Neukundenvertrieb',
    desc: 'Leads, Signale und Aktivitäten für die Neukundengewinnung',
    widgets: ['vertragsuebersicht', 'vertriebsvorgaenge', 'kundensignale', 'aktivitaeten', 'kommunikation'],
  },
  {
    id: 'bestandskunden',
    name: 'Bestandskundenvertrieb',
    desc: 'Vertragslage, Umsätze und offene Vorgänge bestehender Kunden',
    widgets: ['vertragsuebersicht', 'kundenhistorie', 'umsaetze', 'tickets', 'confluence', 'kundensignale', 'kommunikation'],
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

const STORAGE_KEY = 'knkone.dashboard.config.v1'

function loadConfig(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveConfig(cfg: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
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

function App() {
  const [roleId, setRoleId] = useState(ROLES[0].id)
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [config, setConfig] = useState<Record<string, string[]>>(loadConfig)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragSource = useRef<string | null>(null)

  useEffect(() => {
    saveConfig(config)
  }, [config])

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

  function showToast(message: string) {
    // Neues Objekt, damit auch dieselbe Meldung zweimal hintereinander den Timer neu startet.
    setToast({ message })
  }

  function toggleEditing() {
    const next = !editing
    setEditing(next)
    showToast(next ? 'Bearbeiten: Widgets ziehen, entfernen oder hinzufügen' : 'Dashboard gespeichert')
  }

  function removeWidget(id: string) {
    updateWidgets(widgetIds.filter((x) => x !== id))
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
            <p className="eyebrow">Dashboard</p>
            <h1>{role.name}</h1>
            <p className="page-desc">{role.desc}</p>
          </div>
          <div className="page-actions">
            <button className={`btn btn--secondary${editing ? ' is-active' : ''}`} type="button" aria-pressed={editing} onClick={toggleEditing}>
              {editing ? 'Fertig' : 'Bearbeiten'}
            </button>
            <button className="btn btn--primary" type="button" onClick={() => setPickerOpen(true)}>
              <PlusIcon />
              Widget hinzufügen
            </button>
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
