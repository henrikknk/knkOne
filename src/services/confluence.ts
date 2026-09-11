import { ConfluenceService } from '../generated/services/ConfluenceService'
import { htmlToText } from '../lib/format'
import { sharedRequest } from '../lib/sharedRequest'
import { runConnector } from './Connector'

// Der offizielle Connector ruft die Confluence-REST-API v2 über das Atlassian-Gateway auf und braucht dafür die
// Cloud-ID der Instanz (öffentlich unter https://knkcesupport.atlassian.net/_edge/tenant_info).
// Er bietet keine Suche - sie wird hier über die Seiten aller Bereiche angenähert.
const CLOUD_ID = '624c19e0-a118-43f6-b257-0219b04b5bea'
const WIKI_URL = 'https://knkcesupport.atlassian.net/wiki'
const SPACE_BATCH_SIZE = 4

export interface ConfluencePage {
  id: string
  title: string
  spaceName: string
  url: string
  /** Letzte Änderung (ISO), falls der Connector sie mitliefert */
  updated: string | null
  /** Seiteninhalt als Klartext, falls der Connector ihn mitliefert */
  text: string
}

export interface ConfluencePageIndex {
  pages: ConfluencePage[]
  spaceCount: number
  /** Bereiche, die bereits abgefragt wurden - erfolgreich oder nicht */
  loadedSpaces: number
  failedSpaces: number
}

export type ConfluenceIndexState =
  | { status: 'idle'; index: ConfluencePageIndex }
  | { status: 'loading'; index: ConfluencePageIndex }
  | { status: 'ready'; index: ConfluencePageIndex; loadedAt: number }
  | { status: 'error'; index: ConfluencePageIndex; error: unknown }

// Laut Modell liegt die Liste unter „value“, die Confluence-API selbst nennt sie „results“ - beides annehmen.
function entries(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  const body = (response ?? {}) as { value?: unknown; results?: unknown }
  if (Array.isArray(body.value)) return body.value
  if (Array.isArray(body.results)) return body.results
  return []
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  return typeof value === 'number' ? String(value) : ''
}

interface RawPage {
  id?: unknown
  title?: unknown
  status?: unknown
  createdAt?: unknown
  version?: { createdAt?: unknown }
  body?: { storage?: { value?: unknown } }
  _links?: { webui?: unknown }
}

function toPage(entry: unknown, spaceName: string): ConfluencePage[] {
  const page = (entry ?? {}) as RawPage
  const id = text(page.id)
  // Nur veröffentlichte Seiten - keine Entwürfe, archivierten oder gelöschten.
  if (!id || (page.status !== undefined && page.status !== 'current')) return []
  const webui = text(page._links?.webui)
  const body = text(page.body?.storage?.value)
  return [
    {
      id,
      title: text(page.title) || 'Ohne Titel',
      spaceName,
      // Ohne mitgelieferten Link öffnet Confluence jede Seite zuverlässig über ihre ID.
      url: webui.startsWith('/') ? `${WIKI_URL}${webui}` : `${WIKI_URL}/pages/viewpage.action?pageId=${encodeURIComponent(id)}`,
      updated: text(page.version?.createdAt) || text(page.createdAt) || null,
      text: body ? htmlToText(body) : '',
    },
  ]
}

const confluenceSpaces = sharedRequest(async () => {
  const response = await runConnector('Confluence: GetSpaces', () => ConfluenceService.GetSpaces(CLOUD_ID))
  return entries(response).flatMap((entry) => {
    const space = (entry ?? {}) as { id?: unknown; name?: unknown }
    const id = text(space.id)
    return id ? [{ id, name: text(space.name) || id }] : []
  })
}, 10 * 60_000)

const INDEX_TTL_MS = 5 * 60_000
const EMPTY_INDEX: ConfluencePageIndex = { pages: [], spaceCount: 0, loadedSpaces: 0, failedSpaces: 0 }

// Der Seitenindex lebt außerhalb der Widgets: jeder geladene Stapel ist sofort durchsuchbar, und nach einem
// Rollenwechsel lädt es weiter bzw. bleibt einige Minuten zwischengespeichert.
let indexState: ConfluenceIndexState = { status: 'idle', index: EMPTY_INDEX }
/** Zählt Ladevorgänge hoch, damit ein verworfener Vorgang den neueren nicht überschreibt. */
let indexRun = 0
const indexListeners = new Set<() => void>()

function setIndexState(next: ConfluenceIndexState) {
  indexState = next
  indexListeners.forEach((listener) => listener())
}

export function subscribeConfluenceIndex(listener: () => void) {
  indexListeners.add(listener)
  return () => {
    indexListeners.delete(listener)
  }
}

export function getConfluenceIndexState(): ConfluenceIndexState {
  return indexState
}

function toIndex(pages: Map<string, ConfluencePage>, spaceCount: number, loadedSpaces: number, failedSpaces: number): ConfluencePageIndex {
  return { pages: [...pages.values()].sort((a, b) => a.title.localeCompare(b.title, 'de')), spaceCount, loadedSpaces, failedSpaces }
}

/** Der Connector blättert nicht - je Bereich kommt nur die erste Ergebnisseite der Confluence-API. */
async function loadIndex(run: number) {
  const spaces = await confluenceSpaces()
  if (run !== indexRun) return
  const pages = new Map<string, ConfluencePage>()
  const failures: unknown[] = []
  setIndexState({ status: 'loading', index: toIndex(pages, spaces.length, 0, 0) })

  for (let start = 0; start < spaces.length; start += SPACE_BATCH_SIZE) {
    const batch = spaces.slice(start, start + SPACE_BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (space) => {
        const response = await runConnector(`Confluence: GetPagesBySpace (${space.name})`, () => ConfluenceService.GetPagesBySpace(CLOUD_ID, space.id))
        return entries(response).flatMap((entry) => toPage(entry, space.name))
      }),
    )
    if (run !== indexRun) return
    for (const result of results) {
      if (result.status === 'fulfilled') for (const page of result.value) pages.set(page.id, page)
      else failures.push(result.reason)
    }
    setIndexState({ status: 'loading', index: toIndex(pages, spaces.length, start + batch.length, failures.length) })
  }

  if (spaces.length > 0 && failures.length === spaces.length) throw failures[0]
  if (failures.length > 0) console.error('Confluence: einzelne Bereiche konnten nicht geladen werden', failures)
  setIndexState({ status: 'ready', index: toIndex(pages, spaces.length, spaces.length, failures.length), loadedAt: Date.now() })
}

/** Lädt die Seiten aller Bereiche neu, stapelweise zu je SPACE_BATCH_SIZE Bereichen. */
export function reloadConfluencePageIndex() {
  const run = ++indexRun
  setIndexState({ status: 'loading', index: EMPTY_INDEX })
  loadIndex(run).catch((error: unknown) => {
    if (run === indexRun) setIndexState({ status: 'error', index: indexState.index, error })
  })
}

/** Startet das Laden, sofern nicht schon ein Ladevorgang läuft oder ein frischer Stand vorliegt. */
export function ensureConfluencePageIndex() {
  if (indexState.status === 'loading') return
  if (indexState.status === 'ready' && Date.now() - indexState.loadedAt < INDEX_TTL_MS) return
  reloadConfluencePageIndex()
}
