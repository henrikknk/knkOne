/**
 * Wiederverwendbare Dataverse-Zugriffsschicht für Power Apps Code Apps.
 *
 * Diese Datei ist bewusst projektunabhängig: sie kennt keine Tabelle und kein
 * Feld dieses Projekts, sondern nur das Power Apps SDK und die generierte
 * Datenquellen-Registry.
 *
 * Übernahme in ein anderes Projekt:
 *   1. npm i @microsoft/power-apps
 *      npm i -D @microsoft/power-apps-cli @microsoft/power-apps-vite
 *   2. vite.config.ts:  import { powerApps } from '@microsoft/power-apps-vite/plugin'
 *                       plugins: [react(), powerApps()]
 *   3. npx pa app init            (falls noch keine power.config.json existiert)
 *      npx pa app add data-source --connector dataverse --table <logicalname>
 *   4. Diese Datei kopieren. Der Importpfad zu dataSourcesInfo unten ist relativ
 *      zum Projektstamm — bei anderem Ablageort entsprechend anpassen.
 *
 * Danach genügt pro Tabelle eine Zeile:
 *   export const kontakte = dataverseTable<Contacts>('contacts')
 *
 * Der Datenzugriff läuft nur im Power-Apps-Host (`npx pa app run` oder die
 * veröffentlichte App). Unter reinem `npm run dev` gibt es keine Verbindung.
 */
import { getClient } from '@microsoft/power-apps/data'
import type { IOperationOptions, IOperationResult } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'

/** OData-Optionen für Leseabfragen: select, filter, orderBy, top, skip, count … */
export type Query = IOperationOptions

/** Eine Seite Datensätze inkl. Fortsetzungs-Token für das nächste Stück. */
export type Page<TRecord> = {
  records: TRecord[]
  skipToken?: string
  /** Serverseitige Gesamtzahl, nur bei `count: true`. Dataverse deckelt bei 5000. */
  count?: number
}

export class DataverseError extends Error {
  readonly dataSource: string
  readonly operation: string
  /** Ursprünglicher, unveränderter Fehlergrund (z. B. das rohe SDK-/OData-Fehlerobjekt) für Diagnosezwecke. */
  readonly raw?: unknown

  constructor(dataSource: string, operation: string, reason?: unknown) {
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
    super(detail || `Dataverse: „${operation}“ auf „${dataSource}“ ist fehlgeschlagen.`)
    this.name = 'DataverseError'
    this.dataSource = dataSource
    this.operation = operation
    this.raw = reason
  }
}

/** Der geteilte Client — eine Instanz für alle Tabellen der App. */
export const powerClient = getClient(dataSourcesInfo)

/** Namen aller in power.config.json registrierten Datenquellen. */
export const registeredDataSources = Object.keys(dataSourcesInfo)

function unwrap<TResult>(result: IOperationResult<TResult>, dataSource: string, operation: string): TResult {
  if (!result.success) throw new DataverseError(dataSource, operation, result.error)
  return result.data
}

export type TableClient<TRecord> = {
  readonly name: string
  /** Alle Treffer der Abfrage (eine Seite, Größe über `top` bzw. `maxPageSize`). */
  getAll(query?: Query): Promise<TRecord[]>
  /** Wie getAll, zusätzlich mit skipToken und Gesamtzahl für Paging. */
  getPage(query?: Query): Promise<Page<TRecord>>
  get(id: string, select?: string[]): Promise<TRecord>
  create(record: Partial<TRecord>): Promise<TRecord>
  update(id: string, changes: Partial<TRecord>): Promise<TRecord>
  remove(id: string): Promise<void>
}

/**
 * Erzeugt einen typisierten Client für eine registrierte Datenquelle.
 * `name` ist der Schlüssel aus `.power/schemas/appschemas/dataSourcesInfo.ts`
 * (in der Regel der Entity-Set-Name, z. B. 'opportunities').
 */
export function dataverseTable<TRecord>(name: string): TableClient<TRecord> {
  if (!registeredDataSources.includes(name)) {
    throw new DataverseError(
      name,
      'init',
      `Unbekannte Datenquelle „${name}“. Registriert sind: ${registeredDataSources.join(', ') || '(keine)'}. ` +
        'Hinzufügen mit: npx pa app add data-source --connector dataverse --table <logicalname>',
    )
  }

  return {
    name,
    async getAll(query) {
      const result = await powerClient.retrieveMultipleRecordsAsync<TRecord>(name, query)
      return unwrap(result, name, 'getAll') ?? []
    },
    async getPage(query) {
      const result = await powerClient.retrieveMultipleRecordsAsync<TRecord>(name, query)
      return { records: unwrap(result, name, 'getPage') ?? [], skipToken: result.skipToken, count: result.count }
    },
    async get(id, select) {
      const result = await powerClient.retrieveRecordAsync<TRecord>(name, id, select ? { select } : undefined)
      return unwrap(result, name, 'get')
    },
    async create(record) {
      const result = await powerClient.createRecordAsync<Partial<TRecord>, TRecord>(name, record)
      return unwrap(result, name, 'create')
    },
    async update(id, changes) {
      const result = await powerClient.updateRecordAsync<Partial<TRecord>, TRecord>(name, id, changes)
      return unwrap(result, name, 'update')
    },
    async remove(id) {
      unwrap(await powerClient.deleteRecordAsync(name, id), name, 'remove')
    },
  }
}

/**
 * Direktlink auf einen Datensatz im modellgesteuerten CRM, `orgUrl` z. B. aus getContext().app.dataverseOrgUrl.
 * Beispiel: crmRecordUrl(orgUrl, 'opportunity', id)
 */
export function crmRecordUrl(orgUrl: string | undefined, entityLogicalName: string, id: string): string | undefined {
  return orgUrl ? `${orgUrl.replace(/\/$/, '')}/main.aspx?pagetype=entityrecord&etn=${entityLogicalName}&id=${id}` : undefined
}

const formattedSuffix = '@OData.Community.Display.V1.FormattedValue'

/**
 * Anzeigename eines Lookups, unabhängig davon, in welcher Form ihn die Runtime
 * liefert: als `<lookup>name`-Spalte oder als FormattedValue-Annotation.
 * Beispiel: lookupName(opportunity, 'customerid') → „Contoso GmbH“
 */
export function lookupName(record: unknown, lookup: string, fallback = ''): string {
  const raw = (record ?? {}) as Record<string, unknown>
  const candidates = [`${lookup}name`, `_${lookup}_value${formattedSuffix}`, `${lookup}${formattedSuffix}`, `_${lookup}_value`]
  for (const key of candidates) {
    const value = raw[key]
    if (typeof value === 'string' && value !== '') return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

/**
 * Beschriftung eines Optionsset-Werts über die generierte Choice-Map.
 * Beispiel: choiceLabel(Opportunitiesstatuscode, record.statuscode) → „In Bearbeitung“
 */
export function choiceLabel(map: Record<number, string>, value: number | undefined | null): string {
  if (value === undefined || value === null) return ''
  return map[value] ?? ''
}
