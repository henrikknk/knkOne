import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from 'react'
import ChatMarkdown from '../components/ChatMarkdown'
import { WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { errorMessage } from '../lib/format'
import { askPowerPilot } from '../services/powerPilot'

interface ChatMessage {
  id: number
  role: 'user' | 'agent' | 'error'
  text: string
  /** Frage, die nach einem Fehler erneut gesendet werden kann */
  retry?: string
}

interface ChatState {
  messages: ChatMessage[]
  conversationId: string | null
  pending: boolean
}

// Der Verlauf lebt außerhalb des Widgets: Antworten, die nach einem Rollenwechsel eintreffen, gehen nicht verloren,
// und im selben Browser-Tab übersteht das Gespräch auch ein Neuladen.
const STORAGE_KEY = 'knkone.powerpilot.chat.v1'
const MAX_STORED_MESSAGES = 60

function isMessage(value: unknown): value is ChatMessage {
  const message = (value ?? {}) as Partial<ChatMessage>
  return typeof message.id === 'number' && typeof message.text === 'string' && (message.role === 'user' || message.role === 'agent' || message.role === 'error')
}

function loadChat(): ChatState {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<ChatState> | null
    return {
      messages: Array.isArray(parsed?.messages) ? parsed.messages.filter(isMessage) : [],
      conversationId: typeof parsed?.conversationId === 'string' ? parsed.conversationId : null,
      pending: false,
    }
  } catch {
    return { messages: [], conversationId: null, pending: false }
  }
}

let chat = loadChat()
/** Zählt „Neues Gespräch“ hoch, damit spät eintreffende Antworten eines alten Gesprächs verworfen werden. */
let generation = 0
const listeners = new Set<() => void>()

function setChat(next: ChatState) {
  chat = next
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: next.messages.slice(-MAX_STORED_MESSAGES), conversationId: next.conversationId }))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function withMessages(messages: ChatMessage[], additions: Array<Omit<ChatMessage, 'id'>>): ChatMessage[] {
  let id = messages.reduce((max, message) => Math.max(max, message.id), 0)
  return [...messages, ...additions.map((message) => ({ ...message, id: ++id }))]
}

async function ask(question: string) {
  const round = generation
  setChat({ ...chat, pending: true })
  try {
    const reply = await askPowerPilot(question, chat.conversationId ?? undefined)
    if (round !== generation) return
    const answers: Array<Omit<ChatMessage, 'id'>> =
      reply.messages.length > 0
        ? reply.messages.map((text) => ({ role: 'agent', text }))
        : [{ role: 'error', text: 'PowerPilot hat keine Antwort geliefert.', retry: question }]
    setChat({ messages: withMessages(chat.messages, answers), conversationId: reply.conversationId, pending: false })
  } catch (error) {
    if (round !== generation) return
    console.error('PowerPilot: Anfrage fehlgeschlagen', error)
    const text = errorMessage(error, 'PowerPilot ist gerade nicht erreichbar.')
    setChat({ ...chat, messages: withMessages(chat.messages, [{ role: 'error', text, retry: question }]), pending: false })
  }
}

function send(text: string) {
  const question = text.trim()
  if (!question || chat.pending) return
  setChat({ ...chat, messages: withMessages(chat.messages, [{ role: 'user', text: question }]) })
  void ask(question)
}

function retry(message: ChatMessage) {
  if (!message.retry || chat.pending) return
  setChat({ ...chat, messages: chat.messages.filter((entry) => entry.id !== message.id) })
  void ask(message.retry)
}

function resetChat() {
  generation++
  setChat({ messages: [], conversationId: null, pending: false })
}

// Live-Widget: Chat mit dem Copilot-Studio-Agenten PowerPilot; Folgefragen laufen im selben Gespräch.
export default function PowerPilotWidget(props: WidgetProps) {
  const state = useSyncExternalStore(subscribe, () => chat)
  const [draft, setDraft] = useState('')
  const log = useRef<HTMLDivElement>(null)

  // Neue Nachrichten und der Wartehinweis sollen sichtbar sein.
  useEffect(() => {
    const element = log.current
    if (element) element.scrollTop = element.scrollHeight
  }, [state.messages.length, state.pending])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!draft.trim() || state.pending) return
    send(draft)
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const canReset = state.messages.length > 0 || state.pending

  return (
    <WidgetFrame
      {...props}
      bodyClassName="widget-body--flush"
      actions={
        <button type="button" className="widget-action" aria-label="Neues Gespräch" title="Neues Gespräch" disabled={!canReset} onClick={resetChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 7v6M9 10h6" />
          </svg>
        </button>
      }
    >
      <div className="chat">
        <div ref={log} className="chat-log" role="log" aria-live="polite" aria-label="Gespräch mit PowerPilot">
          {state.messages.length === 0 && !state.pending && (
            <div className="chat-intro">
              <strong>Hallo! Wie kann ich heute helfen?</strong>
              <span>PowerPilot beantwortet Wissensfragen zu Dynamics 365 CE und euren Produkten und recherchiert dazu in Confluence, Jira, Azure DevOps, Microsoft Learn und Fachblogs.</span>
              <span className="chat-intro-note">Antworten sind KI-generiert – bitte prüfen.</span>
            </div>
          )}
          {state.messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className="chat-msg chat-msg--user">
                  {message.text}
                </div>
              )
            }
            if (message.role === 'error') {
              return (
                <div key={message.id} className="chat-msg chat-msg--error" role="alert">
                  <span>{message.text}</span>
                  {message.retry && (
                    <button type="button" className="btn btn--small" disabled={state.pending} onClick={() => retry(message)}>
                      Erneut senden
                    </button>
                  )}
                </div>
              )
            }
            return (
              <div key={message.id} className="chat-msg chat-msg--agent">
                <ChatMarkdown text={message.text} />
              </div>
            )
          })}
          {state.pending && (
            <div className="chat-msg chat-msg--agent chat-msg--pending" role="status">
              PowerPilot recherchiert
              <span className="chat-typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>
        <form className="chat-form" onSubmit={submit}>
          <textarea
            className="text-input chat-input"
            rows={1}
            placeholder="Frage an PowerPilot …"
            aria-label="Frage an PowerPilot"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="btn btn--primary chat-send" aria-label="Senden" title="Senden (Enter)" disabled={!draft.trim() || state.pending}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
      </div>
    </WidgetFrame>
  )
}
