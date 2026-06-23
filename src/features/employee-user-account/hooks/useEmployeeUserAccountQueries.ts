import { useQuery } from '@tanstack/react-query'
import { employeeUserAccountApi } from '@/api/resources/employeeUserAccountApi'
import { employeeUserAccountQueryKeys } from '@/features/employee-user-account/queryKeys'

export function useEmployeesPickerQuery(enabled = true) {
  return useQuery({
    queryKey: employeeUserAccountQueryKeys.employeesPicker,
    queryFn: () => employeeUserAccountApi.listEmployeesForPicker(),
    enabled,
    staleTime: 60 * 1000,
  })
}
