import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions'
const DEFAULT_CUSTOMERS = ['HJR', 'SWMH', 'C.H. Beck']

interface CustomerSignal {
  customer: string
  title: string
  date?: string
  source?: string
  url?: string
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
}

async function fetchCustomerSignals(customer: string, apiKey: string): Promise<CustomerSignal[]> {
  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
  })

  if (!response.ok) {
    throw new Error(`Perplexity-Anfrage für ${customer} fehlgeschlagen (HTTP ${response.status})`)
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
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

export async function signals(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders() }
  }

  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      jsonBody: { error: 'PERPLEXITY_API_KEY ist auf der Function App nicht konfiguriert.' },
    }
  }

  const customersParam = request.query.get('customers')
  const customers = customersParam
    ? customersParam.split(',').map((c) => c.trim()).filter(Boolean)
    : DEFAULT_CUSTOMERS

  const collected: CustomerSignal[] = []
  const failures: string[] = []

  // Nacheinander statt parallel, da der Perplexity-Key ein sehr enges Rate-Limit hat.
  for (const customer of customers) {
    try {
      collected.push(...(await fetchCustomerSignals(customer, apiKey)))
    } catch (err) {
      context.error(`Signal-Abruf für ${customer} fehlgeschlagen`, err)
      failures.push(`${customer}: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`)
    }
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    jsonBody: { signals: collected.slice(0, 20), failures },
  }
}

app.http('signals', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'function',
  route: 'signals',
  handler: signals,
})
