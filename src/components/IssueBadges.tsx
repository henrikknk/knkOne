import { useId, useState } from 'react'
import { daysBetween, formatTime, relativeDays, toCalendarDate } from '../lib/format'
import type { JiraComment } from '../services/jira'

/** Schloss für die interne Notiz, Sprechblase für den öffentlichen Kommentar - zwei klar verschiedene Formen. */
function CommentIcon({ internal }: { internal: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {internal ? (
        <>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      ) : (
        <>
          <path d="M21 12a8 8 0 0 1-8 8H4l2.4-2.4A8 8 0 1 1 21 12Z" />
          <path d="M8.5 11h7M8.5 15h4" />
        </>
      )}
    </svg>
  )
}

/**
 * Schaltet ein einzelnes Ticket zwischen gelesen und ungelesen um, ohne es in Jira zu öffnen.
 * Im gelesenen Zustand tritt der Knopf zurück - sonst stünde an jeder Zeile dauerhaft ein Haken.
 */
export function ReadToggleButton({ unread, onToggle }: { unread: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`row-mark-read${unread ? '' : ' is-read'}`}
      onClick={onToggle}
      aria-pressed={!unread}
      aria-label={unread ? 'Ticket als gelesen markieren' : 'Ticket wieder als ungelesen markieren'}
      title={unread ? 'Als gelesen markieren, ohne das Ticket zu öffnen' : 'Wieder als ungelesen markieren'}
    >
      {/* Kontrollkästchen: leer = ungelesen, angehakt = gelesen. Das Symbol zeigt den Zustand, nicht die Aktion. */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        {!unread && <path d="m8.5 12.2 2.6 2.6 6.4-6.4" strokeWidth="2.4" />}
      </svg>
    </button>
  )
}

function whenLabel(comment: JiraComment) {
  const date = new Date(comment.createdMs)
  const day = toCalendarDate(date)
  const today = toCalendarDate(new Date())
  return day && today ? `${relativeDays(daysBetween(today, day))}, ${formatTime(date)}` : formatTime(date)
}

/**
 * Der jüngste Kommentar eines Tickets - immer sichtbar, auch wenn er längst gelesen ist; der Text lässt
 * sich aufklappen. Ungelesen wird die Kopfzeile farbig und fett; zusammen mit dem Wort „Neu“ und dem
 * hervorgehobenen Zeilenhintergrund trägt die Farbe die Aussage nie allein.
 */
export function CommentLine({ comment, unread }: { comment: JiraComment; unread: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const textId = useId()
  const internal = comment.visibility === 'internal'
  const kind = internal ? 'interner Hinweis (nur für das Team sichtbar)' : 'öffentlicher Kommentar (für den Kunden sichtbar)'
  const classes = ['issue-comment', `issue-comment--${comment.visibility}`]
  if (unread) classes.push('issue-comment--unread')
  const who = `${unread ? 'Neuer ' : 'Letzter '}${kind} von ${comment.author}`

  const head = (
    <>
      <CommentIcon internal={internal} />
      {unread && <span className="issue-comment-new">Neu</span>}
      <span className="issue-comment-author">{comment.author}</span>
      <span className="issue-comment-when">
        · {internal ? 'intern' : 'öffentlich'} · {whenLabel(comment)}
      </span>
    </>
  )

  // Ohne Text gibt es nichts aufzuklappen - dann bleibt die Kopfzeile eine reine Anzeige ohne Schaltfläche.
  if (!comment.body) {
    return (
      <div className={classes.join(' ')}>
        <div className="issue-comment-head" title={who}>
          {head}
        </div>
      </div>
    )
  }

  return (
    <div className={classes.join(' ')}>
      {/* Die ganze Kopfzeile schaltet um, nicht nur der kleine Pfeil - das gibt eine größere Trefferfläche. */}
      <button
        type="button"
        className={`issue-comment-head issue-comment-toggle${expanded ? ' is-expanded' : ''}`}
        aria-expanded={expanded}
        aria-controls={textId}
        title={`${who} - ${expanded ? 'Text ausblenden' : 'Text anzeigen'}`}
        onClick={() => setExpanded((value) => !value)}
      >
        {head}
        <svg className="issue-comment-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={textId} className="row-details" hidden={!expanded}>
        <p className="row-description">{comment.body}</p>
      </div>
    </div>
  )
}
