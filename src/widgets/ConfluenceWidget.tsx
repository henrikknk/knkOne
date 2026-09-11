import { useMemo, useState } from 'react'
import { Row, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDate } from '../lib/format'
import { loadConfluencePageIndex, type ConfluencePage } from '../services/confluence'
import { normalizeSearchText, searchTerms } from '../services/search'

const MAX_RESULTS = 50
const NO_PAGES: ConfluencePage[] = []

function ConfluenceSearch() {
  const index = useAsyncData(loadConfluencePageIndex)
  const [query, setQuery] = useState('')
  const pages = index.status === 'ready' ? index.data.pages : NO_PAGES

  // Normalisierte Texte einmal je Ladevorgang statt bei jedem Tastendruck.
  const searchable = useMemo(
    () => pages.map((page) => ({ page, title: normalizeSearchText(page.title), all: normalizeSearchText(`${page.title} ${page.spaceName} ${page.text}`) })),
    [pages],
  )

  const terms = searchTerms(query)
  const matches = searchable.filter((entry) => terms.length > 0 && terms.every((term) => entry.all.includes(term)))
  const inTitle = (entry: (typeof searchable)[number]) => terms.every((term) => entry.title.includes(term))
  const ranked = [...matches.filter(inTitle), ...matches.filter((entry) => !inTitle(entry))].map((entry) => entry.page)

  let content
  if (index.status === 'loading') {
    content = <WidgetSkeleton />
  } else if (index.status === 'error') {
    content = <WidgetNotice kind="offline" text={index.error} onRetry={index.reload} />
  } else if (terms.length === 0) {
    const { spaceCount, failedSpaces } = index.data
    const scope = pages.some((page) => page.text) ? 'Titel und Inhalte' : 'Titel'
    content = (
      <p className="widget-hint">
        Durchsucht die {scope} von {pages.length} Seiten aus {spaceCount} Bereichen
        {failedSpaces > 0 ? ` · ${failedSpaces} Bereiche nicht erreichbar` : ''}
      </p>
    )
  } else if (ranked.length === 0) {
    content = <WidgetEmpty text={`Keine Seiten zu „${query.trim()}“ gefunden`} />
  } else {
    content = (
      <>
        <p className="widget-hint">
          {ranked.length} Treffer{ranked.length > MAX_RESULTS ? `, die ersten ${MAX_RESULTS} werden angezeigt` : ''}
        </p>
        <ul className="rows">
          {ranked.slice(0, MAX_RESULTS).map((page) => (
            <Row
              key={page.id}
              title={
                <a href={page.url} target="_blank" rel="noopener noreferrer">
                  {page.title}
                </a>
              }
              meta={[page.spaceName, page.updated ? `geändert ${formatDate(page.updated)}` : null].filter(Boolean).join(' · ')}
            />
          ))}
        </ul>
      </>
    )
  }

  return (
    <div className="confluence-search">
      <input
        type="search"
        className="text-input"
        placeholder="Confluence-Seiten durchsuchen …"
        aria-label="Confluence-Seiten durchsuchen"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />
      {content}
    </div>
  )
}

// Live-Widget: Suche über die Confluence-Seiten aller Bereiche.
export default function ConfluenceWidget(props: WidgetProps) {
  return (
    <WidgetFrame {...props}>
      <ConfluenceSearch />
    </WidgetFrame>
  )
}
