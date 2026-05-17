import { apiClient } from '@/lib/api'

export type LookupItem = {
  id: number
  name?: string
  label?: string
  title?: string
}

export type LookupMaps = {
  departments: Map<number, string>
  departmentsByName: Map<string, number>
  jobRoles: Map<number, string>
  jobRolesByName: Map<string, number>
  educationLevels: Map<number, string>
  maritalStatuses: Map<number, string>
  satisfaction: Map<number, string>
  /** Inferred from lookup rows or id → label fallback */
  attritionRiskClasses: Map<number, string>
  attritionRiskClassesByName: Map<string, number>
}

function toLabel(item: LookupItem): string {
  return item.name ?? item.label ?? item.title ?? String(item.id)
}

function toMap(items: LookupItem[]): Map<number, string> {
  return new Map(items.map((item) => [item.id, toLabel(item)]))
}

function invertMap(map: Map<number, string>): Map<string, number> {
  const byName = new Map<string, number>()
  map.forEach((label, id) => byName.set(label, id))
  return byName
}

const DEFAULT_ATTRITION_RISK: LookupItem[] = [
  { id: 1, name: 'Low' },
  { id: 2, name: 'Medium' },
  { id: 3, name: 'High' },
]

let cachedLookups: LookupMaps | null = null
let lookupsPromise: Promise<LookupMaps> | null = null

async function fetchLookupList(path: string): Promise<LookupItem[]> {
  try {
    const response = await apiClient.get<LookupItem[]>(path)
    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

export function invalidateLookups() {
  cachedLookups = null
  lookupsPromise = null
}

export async function ensureLookups(): Promise<LookupMaps> {
  if (cachedLookups) return cachedLookups
  if (!lookupsPromise) {
    lookupsPromise = (async () => {
      const [
        departments,
        jobRoles,
        educationLevels,
        maritalStatuses,
        satisfaction,
        attritionRiskRaw,
      ] = await Promise.all([
        fetchLookupList('/lookups/departments'),
        fetchLookupList('/lookups/job-roles'),
        fetchLookupList('/lookups/education-levels'),
        fetchLookupList('/lookups/marital-statuses'),
        fetchLookupList('/lookups/satisfaction-scales'),
        fetchLookupList('/lookups/attrition-risk-classes'),
      ])

      const attritionRisk =
        attritionRiskRaw.length > 0 ? attritionRiskRaw : DEFAULT_ATTRITION_RISK

      const departmentMap = toMap(departments)
      const jobRoleMap = toMap(jobRoles)

      cachedLookups = {
        departments: departmentMap,
        departmentsByName: invertMap(departmentMap),
        jobRoles: jobRoleMap,
        jobRolesByName: invertMap(jobRoleMap),
        educationLevels: toMap(educationLevels),
        maritalStatuses: toMap(maritalStatuses),
        satisfaction: toMap(satisfaction),
        attritionRiskClasses: toMap(attritionRisk),
        attritionRiskClassesByName: invertMap(toMap(attritionRisk)),
      }

      return cachedLookups
    })().finally(() => {
      lookupsPromise = null
    })
  }
  return lookupsPromise
}
