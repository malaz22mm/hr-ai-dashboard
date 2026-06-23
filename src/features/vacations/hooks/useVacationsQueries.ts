import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vacationsApi } from '@/api/resources/vacationsApi'
import { queryKeys } from '@/query/keys'
import type {
  CreateVacationRequestDto,
  ProcessVacationRequestDto,
  VacationStatusFilter,
} from '@/types/dto'

export function useVacationsListQuery(status?: VacationStatusFilter, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vacations.list(status),
    queryFn: () => vacationsApi.list(status),
    enabled,
  })
}

export function useEmployeeVacationsQuery(empId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vacations.employee(empId ?? 0),
    queryFn: () => vacationsApi.listForEmployee(empId!),
    enabled: enabled && empId != null && empId > 0,
  })
}

export function useCreateVacationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVacationRequestDto) => vacationsApi.create(payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: queryKeys.vacations.root })
      void qc.invalidateQueries({ queryKey: queryKeys.vacations.employee(variables.empId) })
    },
  })
}

export function useProcessVacationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProcessVacationRequestDto }) =>
      vacationsApi.process(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vacations.root })
    },
  })
}
