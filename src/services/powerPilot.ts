import { MicrosoftCopilotStudioService } from '../generated/services/MicrosoftCopilotStudioService'
import { runConnector } from './Connector'

// PowerPilot ist ein Copilot-Studio-Agent in derselben Umgebung wie die App. Der Connector erwartet seinen
// Schema-Namen, nicht die ID (Copilot Studio: Einstellungen > Erweitert > Metadaten).
const AGENT_SCHEMA_NAME = 'crb7b_wissensagent_qGCw--'
// ExecuteCopilotAsyncV2 verlangt die Angabe, nutzt sie aber nur im asynchronen Modus.
const NOTIFICATION_URL_PLACEHOLDER = 'https://notificationurlplaceholder'

export interface PowerPilotReply {
  /** Gespräch, in dem Folgefragen weiterlaufen */
  conversationId: string | null
  /** Alle Textantworten dieses Zugs, in Reihenfolge */
  messages: string[]
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Stellt PowerPilot eine Frage und wartet auf die Antwort; mit `conversationId` im selben Gespräch. */
export async function askPowerPilot(message: string, conversationId?: string): Promise<PowerPilotReply> {
  const data: unknown = await runConnector('PowerPilot: ExecuteCopilotAsyncV2', () =>
    MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2(AGENT_SCHEMA_NAME, { message, notificationUrl: NOTIFICATION_URL_PLACEHOLDER }, conversationId),
  )
  // Laut generiertem Modell kommt nichts zurück, tatsächlich liefert der Connector responses, lastResponse und
  // conversationId - die Schreibweise der ID schwankt.
  const body = (data ?? {}) as Record<string, unknown>
  const responses = Array.isArray(body.responses) ? body.responses.map(text).filter(Boolean) : []
  const last = text(body.lastResponse)
  const id = text(body.conversationId) || text(body.ConversationId) || text(body.conversationID)
  return {
    conversationId: id || conversationId || null,
    messages: responses.length > 0 ? responses : last ? [last] : [],
  }
}
