import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { LoadMore, Row, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { errorMessage, formatDate } from '../lib/format'
import {
  ensureConfluencePageIndex,
  getConfluenceIndexState,
  reloadConfluencePageIndex,
  subscribeConfluenceIndex,
} from '../services/confluence'
import { normalizeSearchText, searchTerms } from '../services/search'

const RESULT_BATCH = 50

function ConfluenceSearch() {
  const state = useSyncExternalStore(subscribeConfluenceIndex, getConfluenceIndexState)
  const [query, setQuery] = useState('')
  // Treffer erscheinen stapelweise; ein neuer Suchbegriff beginnt wieder beim ersten Stapel.
  const [shown, setShown] = useState({ query: '', count: RESULT_BATCH })
  const { pages, spaceCount, loadedSpaces, failedSpaces } = state.index
  const loading = state.status === 'idle' || state.status === 'loading'

  useEffect(() => {
    ensureConfluencePageIndex()
  }, [])

  // Normalisierte Texte einmal je geladenem Stapel statt bei jedem Tastendruck.
  const searchable = useMemo(
    () => pages.map((page) => ({ page, title: normalizeSearchText(page.title), all: normalizeSearchText(`${page.title} ${page.spaceName} ${page.text}`) })),
    [pages],
  )

  const terms = searchTerms(query)
  const matches = searchable.filter((entry) => terms.length > 0 && terms.every((term) => entry.all.includes(term)))
  const inTitle = (entry: (typeof searchable)[number]) => terms.every((term) => entry.title.includes(term))
  const ranked = [...matches.filter(inTitle), ...matches.filter((entry) => !inTitle(entry))].map((entry) => entry.page)
  const visibleCount = shown.query === query ? shown.count : RESULT_BATCH
  const progress = loading && spaceCount > 0 ? ` · lädt weitere Bereiche (${loadedSpaces} von ${spaceCount}) …` : ''

  let content
  if (state.status === 'error') {
    content = <WidgetNotice kind="offline" text={errorMessage(state.error, 'Confluence ist nicht erreichbar.')} onRetry={reloadConfluencePageIndex} />
  } else if (loading && pages.length === 0) {
    content = <WidgetSkeleton />
  } else if (terms.length === 0) {
    const scope = pages.some((page) => page.text) ? 'Titel und Inhalte' : 'Titel'
    content = (
      <p className="widget-hint">
        Durchsucht die {scope} von {pages.length} Seiten aus {loading ? loadedSpaces : spaceCount} Bereichen
        {progress}
        {failedSpaces > 0 ? ` · ${failedSpaces} Bereiche nicht erreichbar` : ''}
      </p>
    )
  } else if (ranked.length === 0) {
    content = loading ? (
      <p className="widget-hint">
        Noch keine Seiten zu „{query.trim()}“{progress}
      </p>
    ) : (
      <WidgetEmpty text={`Keine Seiten zu „${query.trim()}“ gefunden`} />
    )
  } else {
    content = (
      <>
        <p className="widget-hint">
          {ranked.length} Treffer{progress}
        </p>
        <ul className="rows">
          {ranked.slice(0, visibleCount).map((page) => (
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
        <LoadMore
          list={{
            hasMore: ranked.length > visibleCount,
            loadingMore: false,
            loadMore: () => setShown({ query, count: visibleCount + RESULT_BATCH }),
          }}
        />
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

// Live-Widget: Suche über die Confluence-Seiten aller Bereiche; die Bereiche werden stapelweise geladen.
export default function ConfluenceWidget(props: WidgetProps) {
  return (
    <WidgetFrame {...props}>
      <ConfluenceSearch />
    </WidgetFrame>
  )
}
