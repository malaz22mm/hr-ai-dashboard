import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '@/api/resources/employeesApi'
import { queryKeys } from '@/query/keys'
import type { CreateEmployeeDto, UpdateEmployeeDto } from '@/types/dto'

export function useCreateEmployeeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeeDto) => employeesApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.root })
    },
  })
}

export function useUpdateEmployeeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateEmployeeDto) => employeesApi.update(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.root })
    },
  })
}

export function useDeleteEmployeeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.root })
    },
  })
}
