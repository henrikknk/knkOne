import { useEffect, useState } from 'react'
import { Row, WidgetFrame, WidgetEmpty, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'

// Kein Secret hardcoden: der Key kommt aus .env.local (nicht eingecheckt), landet aber trotzdem im Browser-Bundle,
// da dieser Aufruf clientseitig läuft. Perplexity erlaubt CORS, hat aber ein sehr enges Rate-Limit -
// Anfragen müssen nacheinander (nicht parallel) laufen, sonst schlagen sie mit HTTP 429 fehl.
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions'

// Schalter zum Sparen von Perplexity-Tokens: auf false setzen, um die Live-Abfrage abzuschalten.
// Aktiv lädt das Widget die Signale beim Öffnen der App und bietet einen Knopf zum Neuladen.
const KUNDENSIGNALE_LIVE_ENABLED = true

// Kundenliste für die Kundensignale.
const KNK_CUSTOMERS = [
  'HJR',
  'SWMH',
  'C.H. Beck',
  '720 Health Media GmbH & Co. KG',
  'Carl Hanser Verlag GmbH & Co. KG',
  'Condé Nast Germany GmbH',
  'Deutscher Landwirtschaftsverlag GmbH',
  'Haufe-Lexware GmbH & Co. KG',
  'Heise Medien GmbH & Co. KG',
  'Holzmann Medien GmbH & Co. KG',
  'Hueber Verlag GmbH & Co. KG',
  'knk Business Software AG',
  'markom GmbH & Co. KG',
  'Verlagsgruppe Beltz Julius Beltz GmbH & Co. KG',
  'Vincentz Network GmbH & Co. KG',
  'WEKA Media GmbH & Co. KG',
  'Wort & Bild Verlag GmbH & Co. KG',
]

interface CustomerSignal {
  customer: string
  title: string
  date?: string
  source?: string
  url?: string
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
}

// Undatierte/nicht parsbare Einträge landen ans Ende statt die Sortierung zu verfälschen.
function sortSignalsByDateDesc(items: CustomerSignal[]): CustomerSignal[] {
  return [...items].sort((a, b) => {
    const timeA = a.date ? Date.parse(a.date) : NaN
    const timeB = b.date ? Date.parse(b.date) : NaN
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
    if (Number.isNaN(timeA)) return 1
    if (Number.isNaN(timeB)) return -1
    return timeB - timeA
  })
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

// Der Key hat ein sehr enges Rate-Limit (429) - bei Bedarf mit Backoff erneut versuchen.
async function fetchCustomerSignals(customer: string, signal?: AbortSignal): Promise<CustomerSignal[]> {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(PERPLEXITY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Recherche-Assistent für den Vertrieb. Antworte ausschließlich mit kompaktem JSON, ohne Markdown und ohne Erklärtext.',
          },
          {
            role: 'user',
            content: `Suche die aktuellsten öffentlichen Nachrichten/Signale (z. B. Meldungen, Personalwechsel, Übernahmen, Digitalisierungsprojekte) zum Unternehmen "${customer}". Antworte als JSON-Array (max. 7 Einträge) mit Objekten {"title": string, "date": string, "source": string, "url": string}.`,
          },
        ],
      }),
      signal,
    })

    if (response.status === 429) {
      if (attempt === maxAttempts) {
        throw new Error(`Perplexity-Anfrage für ${customer} fehlgeschlagen (HTTP 429, Rate-Limit)`)
      }
      const retryAfterSeconds = Number(response.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1500 * attempt
      await delay(waitMs, signal)
      continue
    }

    if (!response.ok) {
      throw new Error(`Perplexity-Anfrage für ${customer} fehlgeschlagen (HTTP ${response.status})`)
    }

    const payload: { choices?: Array<{ message?: { content?: string } }> } = await response.json()
    const content = payload.choices?.[0]?.message?.content ?? '[]'

    let parsed: unknown
    try {
      parsed = JSON.parse(stripJsonFence(content))
    } catch {
      throw new Error(`Antwort für ${customer} enthielt kein lesbares JSON`)
    }
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        customer,
        title: typeof item.title === 'string' ? item.title : 'Ohne Titel',
        date: typeof item.date === 'string' ? item.date : undefined,
        source: typeof item.source === 'string' ? item.source : undefined,
        url: typeof item.url === 'string' ? item.url : undefined,
      }))
  }
  return []
}

type SignalsState =
  | { kind: 'paused'; text: string }
  | { kind: 'offline'; text: string }
  | { kind: 'loading'; signals: CustomerSignal[]; progress: string }
  | { kind: 'ready'; signals: CustomerSignal[]; progress: string }

function initialState(): SignalsState {
  if (!KUNDENSIGNALE_LIVE_ENABLED) return { kind: 'paused', text: 'Live-Abfrage deaktiviert, um Perplexity-Tokens zu sparen.' }
  if (!PERPLEXITY_API_KEY) return { kind: 'offline', text: 'Kein Perplexity API-Key konfiguriert (VITE_PERPLEXITY_API_KEY fehlt in .env.local).' }
  return { kind: 'loading', signals: [], progress: '' }
}

// Live-Widget: aktuelle Kundensignale über die Perplexity-API; Ergebnisse erscheinen Kunde für Kunde.
export default function KundensignaleWidget(props: WidgetProps) {
  const [state, setState] = useState<SignalsState>(initialState)
  const [reloadKey, setReloadKey] = useState(0)
  const canReload = KUNDENSIGNALE_LIVE_ENABLED && Boolean(PERPLEXITY_API_KEY)
  const loading = state.kind === 'loading'

  useEffect(() => {
    if (!KUNDENSIGNALE_LIVE_ENABLED || !PERPLEXITY_API_KEY) return
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      const collected: CustomerSignal[] = []
      const failures: string[] = []
      // Nacheinander statt parallel abfragen, da der API-Key ein sehr enges Rate-Limit hat.
      for (const [index, customer] of KNK_CUSTOMERS.entries()) {
        try {
          collected.push(...(await fetchCustomerSignals(customer, controller.signal)))
        } catch (err) {
          if (controller.signal.aborted) return
          failures.push(`${customer}: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`)
        }
        if (cancelled) return
        setState({ kind: 'loading', signals: sortSignalsByDateDesc(collected), progress: `${index + 1}/${KNK_CUSTOMERS.length}` })
        // Kleiner Puffer zwischen Kunden, damit das enge Rate-Limit sicher zurückgesetzt ist.
        await delay(1200, controller.signal).catch(() => {})
      }
      if (cancelled) return
      setState(
        collected.length === 0 && failures.length > 0
          ? { kind: 'offline', text: failures[0] }
          : { kind: 'ready', signals: sortSignalsByDateDesc(collected), progress: '' },
      )
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [reloadKey])

  // Beginnt die Abfrage von vorn; die laufende bricht der Effekt-Cleanup ab.
  function reload() {
    setState({ kind: 'loading', signals: [], progress: '' })
    setReloadKey((key) => key + 1)
  }

  return (
    <WidgetFrame
      {...props}
      actions={
        canReload ? (
          <button
            type="button"
            className="widget-action"
            onClick={reload}
            disabled={loading}
            aria-label="Kundensignale neu laden"
            title={loading ? 'Kundensignale werden geladen …' : 'Kundensignale neu laden'}
          >
            <svg
              className={loading ? 'is-spinning' : undefined}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v5h-5" />
            </svg>
          </button>
        ) : undefined
      }
    >
      {state.kind === 'paused' || state.kind === 'offline' ? (
        <WidgetNotice kind={state.kind} text={state.text} />
      ) : state.signals.length === 0 ? (
        state.kind === 'loading' ? <WidgetSkeleton /> : <WidgetEmpty text="Keine aktuellen Signale gefunden" />
      ) : (
        <>
          <ul className="rows">
            {state.signals.map((signal, index) => (
              <Row
                key={`${signal.customer}-${index}`}
                title={signal.title}
                href={signal.url}
                meta={[signal.customer, signal.source, signal.date].filter(Boolean).join(' · ')}
              />
            ))}
          </ul>
          {state.kind === 'loading' && <div className="load-more load-more-status">Lädt weitere Kunden … {state.progress}</div>}
        </>
      )}
    </WidgetFrame>
  )
}
