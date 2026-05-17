import { httpClient } from '@/api/httpClient'
import type { LookupItemDto, WorkShiftDto } from '@/types/dto'

export type LookupBundle = {
  departments: LookupItemDto[]
  jobRoles: LookupItemDto[]
  educationLevels: LookupItemDto[]
  maritalStatuses: LookupItemDto[]
  businessTravel: LookupItemDto[]
  performanceRatings: LookupItemDto[]
  attritionRiskClasses: LookupItemDto[]
  shifts: WorkShiftDto[]
  vacationStatuses: LookupItemDto[]
  satisfactionScales: LookupItemDto[]
}

async function getJsonArray<T>(path: string): Promise<T[]> {
  const data = await httpClient.request<unknown>(path)
  return Array.isArray(data) ? (data as T[]) : []
}

export const lookupsApi = {
  async all(): Promise<LookupBundle> {
    const [
      departments,
      jobRoles,
      educationLevels,
      maritalStatuses,
      businessTravel,
      performanceRatings,
      attritionRiskClasses,
      shifts,
      vacationStatuses,
      satisfactionScales,
    ] = await Promise.all([
      getJsonArray<LookupItemDto>('/lookups/departments'),
      getJsonArray<LookupItemDto>('/lookups/job-roles'),
      getJsonArray<LookupItemDto>('/lookups/education-levels'),
      getJsonArray<LookupItemDto>('/lookups/marital-statuses'),
      getJsonArray<LookupItemDto>('/lookups/business-travel'),
      getJsonArray<LookupItemDto>('/lookups/performance-ratings'),
      getJsonArray<LookupItemDto>('/lookups/attrition-risk-classes'),
      getJsonArray<WorkShiftDto>('/lookups/shifts'),
      getJsonArray<LookupItemDto>('/lookups/vacation-statuses'),
      getJsonArray<LookupItemDto>('/lookups/satisfaction-scales'),
    ])

    return {
      departments,
      jobRoles,
      educationLevels,
      maritalStatuses,
      businessTravel,
      performanceRatings,
      attritionRiskClasses,
      shifts,
      vacationStatuses,
      satisfactionScales,
    }
  },
}
