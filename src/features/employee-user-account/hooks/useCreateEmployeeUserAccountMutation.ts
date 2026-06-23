import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeUserAccountApi } from '@/api/resources/employeeUserAccountApi'
import { queryKeys } from '@/query/keys'
import type { CreateEmployeeUserAccountDto } from '@/types/createEmployeeUserAccount'

export function useCreateEmployeeUserAccountMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeeUserAccountDto) => employeeUserAccountApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}
