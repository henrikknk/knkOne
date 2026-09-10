import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { errorMessage } from '../lib/format'
import { loadSearchSource, SEARCH_SOURCES, searchRecords, searchTerms, type SearchRecord } from '../services/search'
import type { WidgetDef } from './widgetTypes'

const MIN_QUERY_LENGTH = 2
const MAX_PER_GROUP = 5

interface SourceState {
  status: 'loading' | 'ready' | 'error'
  records: SearchRecord[]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Hebt wörtliche Vorkommen der Suchbegriffe hervor. */
function highlight(text: string, query: string): ReactNode {
  const words = query.trim().split(/\s+/).filter(Boolean).map(escapeRegExp)
  if (words.length === 0) return text
  // Mit Klammergruppe liefert split() die Treffer an den ungeraden Stellen.
  return text.split(new RegExp(`(${words.join('|')})`, 'gi')).map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part))
}

/** Suchfeld im Seitenkopf: durchsucht die Datensätze aller Live-Widgets, Strg+K springt hinein. */
export default function GlobalSearch({ widgets }: { widgets: WidgetDef[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [sources, setSources] = useState<Record<string, SourceState>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Erst beim Fokussieren laden; bereits geladene Quellen kommen aus dem Zwischenspeicher.
  function loadSources() {
    for (const source of SEARCH_SOURCES) {
      setSources((prev) => (prev[source.id] ? prev : { ...prev, [source.id]: { status: 'loading', records: [] } }))
      loadSearchSource(source).then(
        (records) => setSources((prev) => ({ ...prev, [source.id]: { status: 'ready', records } })),
        (error: unknown) => {
          console.error(`Suche: ${source.label} nicht durchsuchbar`, errorMessage(error, ''))
          setSources((prev) => ({ ...prev, [source.id]: { status: 'error', records: prev[source.id]?.records ?? [] } }))
        },
      )
    }
  }

  const trimmed = query.trim()
  const terms = trimmed.length >= MIN_QUERY_LENGTH ? searchTerms(trimmed) : []
  const groups = SEARCH_SOURCES.map((source) => ({
    source,
    widget: widgets.find((widget) => widget.id === source.widgetId),
    matches: terms.length > 0 ? searchRecords(sources[source.id]?.records ?? [], terms) : [],
  })).filter((group) => group.matches.length > 0)
  const options = groups.flatMap((group) => group.matches.slice(0, MAX_PER_GROUP))
  // Laufende Nummer des ersten angezeigten Treffers je Gruppe, für die Tastatursteuerung über alle Gruppen.
  const groupOffsets = groups.map((_, groupIndex) =>
    groups.slice(0, groupIndex).reduce((sum, group) => sum + Math.min(group.matches.length, MAX_PER_GROUP), 0),
  )
  const active = options.length > 0 ? Math.min(activeIndex, options.length - 1) : -1
  const pending = SEARCH_SOURCES.filter((source) => sources[source.id]?.status !== 'ready' && sources[source.id]?.status !== 'error')
  const failed = SEARCH_SOURCES.filter((source) => sources[source.id]?.status === 'error')
  const showPanel = open && terms.length > 0
  const optionId = (index: number) => `${listId}-option-${index}`

  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, listId])

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (options.length === 0) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((active + step + options.length) % options.length)
    } else if (event.key === 'Enter') {
      const href = options[active]?.href
      if (!href) return
      event.preventDefault()
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (event.key === 'Escape') {
      event.preventDefault()
      if (query) {
        setQuery('')
      } else {
        setOpen(false)
        event.currentTarget.blur()
      }
    }
  }

  return (
    <div
      className="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <div className="search-field">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Alles durchsuchen …"
          aria-label="Datensätze aller Widgets durchsuchen"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={showPanel && groups.length > 0 ? listId : undefined}
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          value={query}
          onFocus={() => {
            setOpen(true)
            loadSources()
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className="search-kbd" aria-hidden="true">
          Strg K
        </kbd>
      </div>

      {showPanel && (
        <div className="search-panel" tabIndex={-1}>
          {groups.length === 0 ? (
            <p className="search-empty">{pending.length > 0 ? 'Suche läuft …' : `Keine Treffer für „${trimmed}“`}</p>
          ) : (
            <div id={listId} role="listbox" aria-label="Suchergebnisse">
              {groups.map((group, groupIndex) => (
                <div key={group.source.id} role="group" aria-label={group.source.label} className="search-group">
                  <div className="search-group-head" aria-hidden="true">
                    {group.widget && (
                      <span className="widget-source" style={{ '--source-color': group.widget.color } as CSSProperties}>
                        {group.widget.sourceShort}
                      </span>
                    )}
                    <span>{group.source.label}</span>
                    <span className="search-group-count">{group.matches.length}</span>
                  </div>
                  {group.matches.slice(0, MAX_PER_GROUP).map((record, index) => {
                    const optionIndex = groupOffsets[groupIndex] + index
                    const shared = {
                      id: optionId(optionIndex),
                      role: 'option',
                      'aria-selected': optionIndex === active,
                      className: `search-result${optionIndex === active ? ' is-active' : ''}`,
                      onMouseEnter: () => setActiveIndex(optionIndex),
                    }
                    const content = (
                      <>
                        <span className="search-result-title">{highlight(record.title, trimmed)}</span>
                        {record.meta && <span className="search-result-meta">{highlight(record.meta, trimmed)}</span>}
                      </>
                    )
                    return record.href ? (
                      <a key={`${record.id}-${index}`} {...shared} href={record.href} target="_blank" rel="noopener noreferrer">
                        {content}
                      </a>
                    ) : (
                      <div key={`${record.id}-${index}`} {...shared}>
                        {content}
                      </div>
                    )
                  })}
                  {group.matches.length > MAX_PER_GROUP && (
                    <p className="search-more">+ {group.matches.length - MAX_PER_GROUP} weitere – Suche verfeinern</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {pending.length > 0 && groups.length > 0 && (
            <p className="search-status">Durchsucht noch: {pending.map((source) => source.label).join(', ')}</p>
          )}
          {failed.length > 0 && (
            <p className="search-status search-status--error">Nicht erreichbar: {failed.map((source) => source.label).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}
