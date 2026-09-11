import { Fragment, type ReactNode } from 'react'

// Kleiner, sicherer Markdown-Ausschnitt für Agentenantworten: Absätze, Überschriften, Listen, Fettdruck, Links und
// Quellenverweise wie [1] mit Definitionen "[1]: https://… "Titel"". Kein HTML - alles wird als Text gerendert.

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])|\[(\d{1,2})\]/g
const REFERENCE = /^\s*\[(\d{1,2})\]:\s*(https?:\/\/\S+)(?:\s+"([^"]*)")?\s*$/
const HEADING = /^\s*#{1,6}\s+(.*)$/
const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

type References = Map<string, { url: string; title: string }>

type Block = { kind: 'paragraph'; lines: string[] } | { kind: 'heading'; text: string } | { kind: 'list'; ordered: boolean; items: string[] }

function parse(source: string): { blocks: Block[]; references: References } {
  const references: References = new Map()
  const blocks: Block[] = []
  let current: Block | null = null

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const reference = REFERENCE.exec(line)
    if (reference) {
      references.set(reference[1], { url: reference[2], title: reference[3] || reference[2] })
      continue
    }
    if (!line.trim()) {
      current = null
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', text: heading[1] })
      current = null
      continue
    }
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    const item = bullet ?? numbered
    if (item) {
      const ordered = numbered !== null
      if (current?.kind !== 'list' || current.ordered !== ordered) {
        current = { kind: 'list', ordered, items: [] }
        blocks.push(current)
      }
      current.items.push(item[1])
      continue
    }
    if (current?.kind !== 'paragraph') {
      current = { kind: 'paragraph', lines: [] }
      blocks.push(current)
    }
    current.lines.push(line.trim())
  }
  return { blocks, references }
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function inline(text: string, references: References, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const [whole, bold, label, url, bare, citation] = match
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    const key = `${keyPrefix}-${index}`
    if (bold !== undefined) {
      nodes.push(<strong key={key}>{inline(bold, references, key)}</strong>)
    } else if (label !== undefined) {
      nodes.push(
        <ExternalLink key={key} href={url}>
          {label}
        </ExternalLink>,
      )
    } else if (bare !== undefined) {
      nodes.push(
        <ExternalLink key={key} href={bare}>
          {bare}
        </ExternalLink>,
      )
    } else {
      const reference = references.get(citation)
      nodes.push(
        reference ? (
          <sup key={key}>
            <ExternalLink href={reference.url}>{citation}</ExternalLink>
          </sup>
        ) : (
          whole
        ),
      )
    }
    last = index + whole.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function ChatMarkdown({ text }: { text: string }) {
  const { blocks, references } = parse(text)
  return (
    <div className="chat-md">
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <p key={i}>
              <strong>{inline(block.text, references, `${i}`)}</strong>
            </p>
          )
        }
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{inline(item, references, `${i}-${j}`)}</li>
              ))}
            </List>
          )
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line, references, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
      {references.size > 0 && (
        <div className="chat-sources">
          <span>Quellen</span>
          {[...references].map(([number, reference]) => (
            <ExternalLink key={number} href={reference.url}>
              [{number}] {reference.title}
            </ExternalLink>
          ))}
        </div>
      )}
    </div>
  )
}
