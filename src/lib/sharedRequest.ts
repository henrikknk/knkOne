/**
 * Bündelt gleiche Abfragen: Wer innerhalb von `ttlMs` erneut fragt, bekommt dieselbe (ggf. noch laufende) Anfrage.
 * Fehlgeschlagene Anfragen werden nicht behalten, damit ein erneuter Versuch wirklich neu lädt.
 */
export function sharedRequest<T>(load: () => Promise<T>, ttlMs = 30_000): () => Promise<T> {
  let cached: { startedAt: number; promise: Promise<T> } | null = null
  return () => {
    if (cached && Date.now() - cached.startedAt < ttlMs) return cached.promise
    const promise = load().catch((error: unknown) => {
      cached = null
      throw error
    })
    cached = { startedAt: Date.now(), promise }
    return promise
  }
}
