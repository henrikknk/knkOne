import { dataverseTable } from './Dataverse'
import type { Leads } from '../generated/models/LeadsModel'
import type { Opportunities } from '../generated/models/OpportunitiesModel'
import type { Systemusers } from '../generated/models/SystemusersModel'
import type { Activitypointers } from '../generated/models/ActivitypointersModel'
import type { Knk_subscriptions } from '../generated/models/Knk_subscriptionsModel'
import type { Knk_subscriptionservices } from '../generated/models/Knk_subscriptionservicesModel'
import type { Knk_contracttypes } from '../generated/models/Knk_contracttypesModel'

export const leadsTable = dataverseTable<Leads>('leads')
export const opportunitiesTable = dataverseTable<Opportunities>('opportunities')
export const systemUsersTable = dataverseTable<Systemusers>('systemusers')
export const activitiesTable = dataverseTable<Activitypointers>('activitypointers')
export const subscriptionsTable = dataverseTable<Knk_subscriptions>('knk_subscriptions')
export const subscriptionServicesTable = dataverseTable<Knk_subscriptionservices>('knk_subscriptionservices')
export const contractTypesTable = dataverseTable<Knk_contracttypes>('knk_contracttypes')
