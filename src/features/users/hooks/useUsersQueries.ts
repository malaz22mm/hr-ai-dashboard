import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { usersApi } from '@/api/resources/usersApi'

export function useUsersListQuery(search?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.list(search),
    queryFn: () => usersApi.list(search),
    enabled,
  })
}
