import { getContext } from '@microsoft/power-apps/app'
import { systemUsersTable } from './tables'

export interface CrmContext {
  /** systemuserid des angemeldeten Benutzers */
  userId: string
  orgUrl?: string
}

let contextPromise: Promise<CrmContext> | null = null

async function resolveCrmContext(): Promise<CrmContext> {
  const context = await getContext()
  const aadObjectId = context.user.objectId
  if (!aadObjectId) throw new Error('Keine Azure-AD-Objekt-ID im App-Kontext gefunden')
  const users = await systemUsersTable.getAll({
    select: ['systemuserid'],
    filter: `azureactivedirectoryobjectid eq ${aadObjectId}`,
    top: 1,
  })
  if (!users[0]) throw new Error('Kein Dataverse-Benutzer zur aktuellen Anmeldung gefunden')
  return { userId: users[0].systemuserid, orgUrl: context.app.dataverseOrgUrl }
}

/** Dataverse-Benutzer und Org-URL, einmal pro Sitzung ermittelt. */
export function crmContext(): Promise<CrmContext> {
  if (!contextPromise) {
    contextPromise = resolveCrmContext().catch((error: unknown) => {
      contextPromise = null
      throw error
    })
  }
  return contextPromise
}
