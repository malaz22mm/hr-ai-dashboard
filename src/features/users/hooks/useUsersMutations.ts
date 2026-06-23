import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/resources/usersApi'
import { queryKeys } from '@/query/keys'
import type { CreateUserDto } from '@/types/dto'

export function useCreateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserDto) => usersApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}

export function useDeleteUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.root })
    },
  })
}
