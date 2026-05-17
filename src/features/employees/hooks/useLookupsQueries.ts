import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { lookupsApi } from '@/api/resources/lookupsApi'

const LOOKUP_STALE_MS = 30 * 60 * 1000

export function useLookupsBundleQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.lookups.bundle,
    queryFn: () => lookupsApi.all(),
    enabled,
    staleTime: LOOKUP_STALE_MS,
    gcTime: 60 * 60 * 1000,
  })
}
