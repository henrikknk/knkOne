/**
 * Wiederverwendbare Hülle für Aufrufe generierter Connector-Services
 * (src/generated/services/*Service.ts) in Power Apps Code Apps.
 *
 * Projektunabhängig: macht aus dem `{ success, data, error }`-Ergebnis des SDK
 * entweder den reinen Wert oder einen geworfenen ConnectorError.
 *
 *   const issues = await runConnector('Jira: ListIssues', () => JiraService.ListIssues(...))
 *
 * Wie bei Dataverse gilt: Daten gibt es nur im Power-Apps-Host (`npx pa app run`
 * oder die veröffentlichte App), nicht unter reinem `npm run dev`.
 */
import type { IOperationResult } from '@microsoft/power-apps/data'

export class ConnectorError extends Error {
  readonly operation: string
  /** Ursprünglicher, unveränderter Fehlergrund für Diagnosezwecke. */
  readonly raw?: unknown

  constructor(operation: string, reason?: unknown) {
    let detail = ''
    if (reason instanceof Error) {
      detail = reason.message
    } else if (typeof reason === 'string') {
      detail = reason
    } else if (reason && typeof reason === 'object') {
      try {
        detail = JSON.stringify(reason)
      } catch {
        detail = ''
      }
    }
    super(detail || `Connector-Aufruf „${operation}“ ist fehlgeschlagen.`)
    this.name = 'ConnectorError'
    this.operation = operation
    this.raw = reason
  }
}

export async function runConnector<T>(operation: string, call: () => Promise<IOperationResult<T>>): Promise<T> {
  const result = await call()
  if (!result.success) throw new ConnectorError(operation, result.error)
  return result.data
}
