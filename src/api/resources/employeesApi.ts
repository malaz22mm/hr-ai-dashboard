import { httpClient } from '@/api/httpClient'
import { toQueryString } from '@/utils/queryString'
import { clampSkip, clampTake, computeTotalPages, normalizePaginationMeta } from '@/utils/pagination'
import type {
  EmployeeRecord,
  EmployeeStatsGroupBy,
  EmployeeStatsGroupDto,
  PaginatedEmployeesResponseDto,
} from '@/types/dto'

export type EmployeeListQuery = Record<string, string | number | boolean | undefined | null>

function normalizePaginatedEmployees(raw: unknown): PaginatedEmployeesResponseDto {
  if (raw === null || typeof raw !== 'object') {
    return { data: [], meta: { total: 0, skip: 0, take: 0, pages: 0 } }
  }
  const o = raw as Record<string, unknown>
  const data = Array.isArray(o.data) ? (o.data as EmployeeRecord[]) : []
  const meta = normalizePaginationMeta(o.meta) ?? { total: 0, skip: 0, take: 0, pages: 0 }
  if (meta.pages === undefined) {
    meta.pages = computeTotalPages(meta)
  }
  return { data, meta }
}

export const employeesApi = {
  list(query: EmployeeListQuery = {}): Promise<PaginatedEmployeesResponseDto> {
    const q: EmployeeListQuery = {
      ...query,
      skip: clampSkip(typeof query.skip === 'number' ? query.skip : Number(query.skip)),
      take: clampTake(typeof query.take === 'number' ? query.take : Number(query.take)),
    }
    const qs = toQueryString(q as Record<string, string | number | boolean | undefined | null>)
    return httpClient
      .request<unknown>(`/employees${qs}`)
      .then((raw) => normalizePaginatedEmployees(raw))
  },

  stats(groupBy: EmployeeStatsGroupBy): Promise<EmployeeStatsGroupDto[]> {
    const qs = toQueryString({ groupBy })
    return httpClient.request<EmployeeStatsGroupDto[]>(`/employees/stats${qs}`)
  },
}
