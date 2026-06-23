import { useQuery } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'
import { employeesApi } from '@/api/resources/employeesApi'
import { queryKeys } from '@/query/keys'

const PREDICTION_STALE_MS = 2 * 60 * 1000

export function useAttritionPredictionQuery(employeeId: number | null, enabled = true) {
  const validId =
    employeeId != null && Number.isFinite(employeeId) && employeeId >= 0 ? employeeId : null

  return useQuery({
    queryKey: queryKeys.employees.attritionPrediction(validId ?? -1),
    queryFn: () => employeesApi.attritionPrediction(validId!),
    enabled: enabled && validId != null,
    staleTime: PREDICTION_STALE_MS,
    retry: (failureCount, error) => {
      if (isApiError(error)) {
        if (error.status === 404 || error.status === 503) return false
        if (error.status >= 400 && error.status < 500) return false
      }
      return failureCount < 1
    },
  })
}
