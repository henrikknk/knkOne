import { dataverseTable } from './Dataverse'
import type { Leads } from '../generated/models/LeadsModel'
import type { Opportunities } from '../generated/models/OpportunitiesModel'
import type { Systemusers } from '../generated/models/SystemusersModel'
import type { Activitypointers } from '../generated/models/ActivitypointersModel'

export const leadsTable = dataverseTable<Leads>('leads')
export const opportunitiesTable = dataverseTable<Opportunities>('opportunities')
export const systemUsersTable = dataverseTable<Systemusers>('systemusers')
export const activitiesTable = dataverseTable<Activitypointers>('activitypointers')
