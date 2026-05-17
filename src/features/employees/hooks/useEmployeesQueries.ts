import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { employeesApi, type EmployeeListQuery } from '@/api/resources/employeesApi'
import type { EmployeeStatsGroupBy } from '@/types/dto'

export function useEmployeesQuery(query: EmployeeListQuery, enabled = true) {
  const stable = { ...query }
  return useQuery({
    queryKey: queryKeys.employees.list(stable),
    queryFn: () => employeesApi.list(stable),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useEmployeeStatsQuery(groupBy: EmployeeStatsGroupBy, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.stats(groupBy),
    queryFn: () => employeesApi.stats(groupBy),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
