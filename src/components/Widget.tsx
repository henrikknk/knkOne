import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { PagedList } from '../hooks/usePagedList'
import type { Urgency } from '../lib/format'
import type { Tone, WidgetProps } from './widgetTypes'

interface WidgetFrameProps extends WidgetProps {
  /** Kennzahl rechts im Kopf, z. B. Anzahl kritischer Einträge oder Gesamtbetrag */
  badge?: ReactNode
  /** Leiste unter dem Kopf, z. B. Umschalter */
  toolbar?: ReactNode
  children: ReactNode
}

export function WidgetFrame({ widget, editing, dragging, onRemove, onDragStart, onDragEnd, onDrop, badge, toolbar, children }: WidgetFrameProps) {
  const titleId = `widget-${widget.id}-title`
  return (
    <section
      className={`widget${editing ? ' is-editing' : ''}${dragging ? ' is-dragging' : ''}`}
      aria-labelledby={titleId}
      draggable={editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (editing) event.preventDefault()
      }}
      onDrop={(event) => {
        if (!editing) return
        event.preventDefault()
        onDrop()
      }}
    >
      <header className="widget-head">
        {editing && (
          <span className="drag-handle" title="Ziehen zum Anordnen" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.4" />
              <circle cx="9" cy="12" r="1.4" />
              <circle cx="9" cy="18" r="1.4" />
              <circle cx="15" cy="6" r="1.4" />
              <circle cx="15" cy="12" r="1.4" />
              <circle cx="15" cy="18" r="1.4" />
            </svg>
          </span>
        )}
        <span className="widget-source" style={{ '--source-color': widget.color } as CSSProperties} aria-hidden="true">
          {widget.sourceShort}
        </span>
        <div className="widget-titles">
          <h2 id={titleId} className="widget-title">
            {widget.title}
          </h2>
          <span className="widget-subtitle">{widget.source}</span>
        </div>
        {badge && <div className="widget-badge">{badge}</div>}
        {editing && (
          <button className="widget-remove" type="button" aria-label={`${widget.title} entfernen`} onClick={onRemove}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </header>
      {toolbar && <div className="widget-toolbar">{toolbar}</div>}
      <div className="widget-body">{children}</div>
    </section>
  )
}

export function Pill({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span className={`pill pill--${tone}`} title={title}>
      {children}
    </span>
  )
}

interface RowProps {
  urgency?: Urgency
  title: ReactNode
  href?: string
  meta?: ReactNode
  tags?: ReactNode
  aside?: ReactNode
}

/** Listeneintrag; die Dringlichkeit färbt die linke Kante und hebt kritische Einträge hervor. */
export function Row({ urgency = 'normal', title, href, meta, tags, aside }: RowProps) {
  return (
    <li className={`row row--${urgency}`}>
      <div className="row-main">
        <div className="row-title">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        {meta && <div className="row-meta">{meta}</div>}
        {tags && <div className="row-tags">{tags}</div>}
      </div>
      {aside && <div className="row-aside">{aside}</div>}
    </li>
  )
}

export function WidgetNotice({ kind, text, onRetry }: { kind: 'offline' | 'paused'; text: string; onRetry?: () => void }) {
  return (
    <div className={`notice notice--${kind}`} role={kind === 'offline' ? 'alert' : 'status'}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {kind === 'offline' ? (
          <>
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 2.7 17.1A1.8 1.8 0 0 0 4.3 20h15.4a1.8 1.8 0 0 0 1.6-2.9L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M10 9v6M14 9v6" />
          </>
        )}
      </svg>
      <div className="notice-text">
        <strong>{kind === 'offline' ? 'Verbindung nicht aktiv' : 'Pausiert'}</strong>
        <span>{text}</span>
        {onRetry && (
          <button type="button" className="btn btn--small" onClick={onRetry}>
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  )
}

export function WidgetEmpty({ text }: { text: string }) {
  return (
    <div className="empty">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{text}</span>
    </div>
  )
}

export function WidgetSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="rows" aria-busy="true" aria-label="Wird geladen">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="row row--skeleton">
          <div className="row-main">
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--meta" />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Lädt den nächsten Stapel, sobald das Listenende in den sichtbaren Bereich des Widgets scrollt. */
export function LoadMore({ list }: { list: Pick<PagedList<unknown>, 'hasMore' | 'loadingMore' | 'loadMore' | 'error'> }) {
  const ref = useRef<HTMLDivElement>(null)
  const { hasMore, loadingMore, loadMore, error } = list

  useEffect(() => {
    const element = ref.current
    if (!element || !hasMore || loadingMore || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { root: element.closest('.widget-body'), rootMargin: '0px 0px 160px 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, error, loadMore])

  if (!hasMore && !error) return null
  return (
    <div ref={ref} className="load-more">
      {loadingMore ? (
        <span className="load-more-status" aria-live="polite">
          Lädt weitere …
        </span>
      ) : (
        <button type="button" className="btn btn--ghost btn--small" onClick={loadMore}>
          {error ? 'Erneut versuchen' : 'Weitere laden'}
        </button>
      )}
      {error && <span className="load-more-error">{error}</span>}
    </div>
  )
}

interface PagedRowsProps<T> {
  list: PagedList<T>
  empty: string
  renderItem: (item: T) => ReactNode
}

/** Einheitliche Zustände für stapelweise geladene Listen: Laden, Verbindung inaktiv, leer, Einträge. */
export function PagedRows<T>({ list, empty, renderItem }: PagedRowsProps<T>) {
  if (list.status === 'loading') return <WidgetSkeleton />
  if (list.status === 'error') return <WidgetNotice kind="offline" text={list.error ?? ''} onRetry={list.reload} />
  if (list.items.length === 0) return <WidgetEmpty text={empty} />
  return (
    <>
      <ul className="rows">{list.items.map(renderItem)}</ul>
      <LoadMore list={list} />
    </>
  )
}
