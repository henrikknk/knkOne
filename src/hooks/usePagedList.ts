import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../lib/format'

/** Eine Seite Einträge; `next` fehlt auf der letzten Seite. */
export interface Page<T, C> {
  items: T[]
  next?: C
}

/** Lädt die Seite zu `cursor` (undefined = erste Seite). Muss referenzstabil sein (Modulfunktion oder useCallback). */
export type PageLoader<T, C> = (cursor: C | undefined) => Promise<Page<T, C>>

export interface PagedList<T> {
  items: T[]
  status: 'loading' | 'ready' | 'error'
  error?: string
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
  reload: () => void
}

interface State<T, C> {
  items: T[]
  status: 'loading' | 'ready' | 'error'
  error?: string
  loadingMore: boolean
  cursor?: C
  done: boolean
}

function initialState<T, C>(): State<T, C> {
  return { items: [], status: 'loading', loadingMore: false, done: false }
}

function withPage<T, C>(page: Page<T, C>, append: boolean) {
  return (prev: State<T, C>): State<T, C> => ({
    items: append ? [...prev.items, ...page.items] : page.items,
    status: 'ready',
    loadingMore: false,
    cursor: page.next,
    done: page.next === undefined,
  })
}

function withError<T, C>(error: unknown, append: boolean) {
  const message = errorMessage(error, 'Daten konnten nicht geladen werden')
  // Fehler beim Nachladen: bereits geladene Einträge behalten, erneuter Versuch bleibt möglich.
  return (prev: State<T, C>): State<T, C> =>
    append ? { ...prev, loadingMore: false, error: message } : { items: [], status: 'error', error: message, loadingMore: false, done: true }
}

/**
 * Lädt Daten stapelweise statt alles auf einmal: erste Seite beim Mounten, weitere über `loadMore`
 * (typischerweise ausgelöst, wenn das Listenende in den sichtbaren Bereich scrollt).
 */
export function usePagedList<T, C>(loader: PageLoader<T, C>): PagedList<T> {
  const [state, setState] = useState<State<T, C>>(initialState)
  const [reloadKey, setReloadKey] = useState(0)
  // Jede Anfrage bekommt eine Nummer - Antworten veralteter Anfragen (Reload) werden verworfen.
  const requestId = useRef(0)

  useEffect(() => {
    let active = true
    const id = ++requestId.current
    loader(undefined).then(
      (page) => {
        if (active && id === requestId.current) setState(withPage(page, false))
      },
      (error: unknown) => {
        if (active && id === requestId.current) setState(withError<T, C>(error, false))
      },
    )
    return () => {
      active = false
    }
  }, [loader, reloadKey])

  const fetchMore = useCallback(
    (cursor: C | undefined) => {
      const id = ++requestId.current
      loader(cursor).then(
        (page) => {
          if (id === requestId.current) setState(withPage(page, true))
        },
        (error: unknown) => {
          if (id === requestId.current) setState(withError<T, C>(error, true))
        },
      )
    },
    [loader],
  )

  const loadMore = () => {
    if (state.status !== 'ready' || state.loadingMore || state.done) return
    setState((prev) => ({ ...prev, loadingMore: true, error: undefined }))
    fetchMore(state.cursor)
  }

  const reload = () => {
    setState(initialState<T, C>())
    setReloadKey((key) => key + 1)
  }

  return {
    items: state.items,
    status: state.status,
    error: state.error,
    hasMore: state.status === 'ready' && !state.done,
    loadingMore: state.loadingMore,
    loadMore,
    reload,
  }
}

/**
 * Für Quellen ohne serverseitiges Blättern (z. B. To-Do): einmal vollständig laden, dann stapelweise ausgeben.
 * Die erste Seite lädt immer neu, damit ein Reload aktuelle Daten liefert.
 */
export function pagesFromAll<T>(fetchAll: () => Promise<T[]>, pageSize: number): PageLoader<T, number> {
  let cache: T[] = []
  return async (offset) => {
    if (offset === undefined) cache = await fetchAll()
    const start = offset ?? 0
    const end = start + pageSize
    return { items: cache.slice(start, end), next: end < cache.length ? end : undefined }
  }
}
