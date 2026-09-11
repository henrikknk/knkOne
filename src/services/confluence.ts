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
  failedSpaces: number
}

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

async function inBatches<T, R>(items: T[], size: number, task: (item: T) => Promise<R>): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = []
  for (let start = 0; start < items.length; start += size) {
    results.push(...(await Promise.allSettled(items.slice(start, start + size).map(task))))
  }
  return results
}

const confluenceSpaces = sharedRequest(async () => {
  const response = await runConnector('Confluence: GetSpaces', () => ConfluenceService.GetSpaces(CLOUD_ID))
  return entries(response).flatMap((entry) => {
    const space = (entry ?? {}) as { id?: unknown; name?: unknown }
    const id = text(space.id)
    return id ? [{ id, name: text(space.name) || id }] : []
  })
}, 10 * 60_000)

/**
 * Seiten aller Bereiche für die Suche, einige Minuten zwischengespeichert.
 * Der Connector blättert nicht - je Bereich kommt nur die erste Ergebnisseite der Confluence-API.
 */
export const loadConfluencePageIndex = sharedRequest(async (): Promise<ConfluencePageIndex> => {
  const spaces = await confluenceSpaces()
  const results = await inBatches(spaces, SPACE_BATCH_SIZE, async (space) => {
    const response = await runConnector(`Confluence: GetPagesBySpace (${space.name})`, () => ConfluenceService.GetPagesBySpace(CLOUD_ID, space.id))
    return entries(response).flatMap((entry) => toPage(entry, space.name))
  })

  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  if (spaces.length > 0 && failures.length === results.length) throw failures[0].reason
  if (failures.length > 0) console.error('Confluence: einzelne Bereiche konnten nicht geladen werden', failures)

  const pages = new Map<string, ConfluencePage>()
  for (const result of results) {
    if (result.status === 'fulfilled') for (const page of result.value) pages.set(page.id, page)
  }
  return {
    pages: [...pages.values()].sort((a, b) => a.title.localeCompare(b.title, 'de')),
    spaceCount: spaces.length,
    failedSpaces: failures.length,
  }
}, 5 * 60_000)
