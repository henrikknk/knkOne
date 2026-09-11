import type { GetTask_Response_V2 } from '../generated/models/PlannerModel'
import { PlannerService } from '../generated/services/PlannerService'
import { timelineItem, type TimelineItem } from '../lib/chartData'
import { sharedRequest } from '../lib/sharedRequest'
import { runConnector } from './Connector'

// Planner kennt als Fortschritt nur 0, 50 und 100 Prozent.
const COMPLETE = 100

export interface PlannerTaskRow {
  id: string
  title: string
  /** Name des Plans, aus dem die Aufgabe stammt */
  plan: string
  statusLabel: string
  /** Fälligkeit als ISO-Zeitpunkt, null wenn keine gesetzt ist */
  dueDate: string | null
  created: string | null
}

function statusLabel(percentComplete: number) {
  if (percentComplete >= COMPLETE) return 'Erledigt'
  return percentComplete > 0 ? 'In Bearbeitung' : 'Nicht begonnen'
}

function toRow(task: GetTask_Response_V2, planTitles: Map<string, string>): PlannerTaskRow {
  return {
    id: task.id ?? '',
    title: task.title || 'Ohne Titel',
    plan: (task.planId && planTitles.get(task.planId)) || 'Unbekannter Plan',
    statusLabel: statusLabel(task.percentComplete ?? 0),
    dueDate: task.dueDateTime || null,
    created: task.createdDateTime ?? null,
  }
}

// Fällige zuerst (früheste oben), danach Aufgaben ohne Fälligkeit, neueste zuerst.
function compareTasks(a: PlannerTaskRow, b: PlannerTaskRow) {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return (b.created ?? '').localeCompare(a.created ?? '')
}

// Mehrere Tabs, Diagramme und die Suche fragen kurz nacheinander dasselbe ab - eine Anfrage für alle.
/** Alle mir zugewiesenen Planner-Aufgaben, auch erledigte. */
const assignedTasks = sharedRequest(async (): Promise<GetTask_Response_V2[]> => {
  const tasks = await runConnector('Planner: ListMyTasks_V2', () => PlannerService.ListMyTasks_V2())
  return tasks?.value ?? []
})

const myPlans = sharedRequest(() => runConnector('Planner: ListMyPlans_V2', () => PlannerService.ListMyPlans_V2()))

/** Offene Planner-Aufgaben, die dem angemeldeten Benutzer zugewiesen sind, jeweils mit dem Namen ihres Plans. */
export async function listMyPlannerTasks(): Promise<PlannerTaskRow[]> {
  const [tasks, plans] = await Promise.all([
    assignedTasks(),
    // Ohne Planliste fehlen nur die Namen - die Aufgaben trotzdem anzeigen.
    myPlans().catch((error: unknown) => {
      console.error('Planner: Pläne konnten nicht geladen werden', error)
      return undefined
    }),
  ])
  const planTitles = new Map<string, string>()
  for (const plan of plans?.value ?? []) {
    if (plan.id) planTitles.set(plan.id, plan.title || 'Ohne Namen')
  }
  return tasks
    .filter((task) => (task.percentComplete ?? 0) < COMPLETE)
    .map((task) => toRow(task, planTitles))
    .sort(compareTasks)
}

/** Anlage- und Erledigungszeitpunkte der mir zugewiesenen Planner-Aufgaben - für den Auslastungsverlauf. */
export async function listMyPlannerTimeline(): Promise<TimelineItem[]> {
  return (await assignedTasks()).flatMap((task) => {
    if ((task.percentComplete ?? 0) < COMPLETE) return timelineItem(task.createdDateTime, null)
    // Erledigte Aufgaben ohne Erledigungszeitpunkt lassen sich zeitlich nicht einordnen.
    return task.completedDateTime ? timelineItem(task.createdDateTime, task.completedDateTime) : []
  })
}
