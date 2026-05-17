import { httpClient } from '@/api/httpClient'
import { toQueryString } from '@/utils/queryString'
import { sanitizeUsersResponse, type SafeUser } from '@/utils/sanitize'
import type { CreateUserDto, UserResponseDto } from '@/types/dto'

export const usersApi = {
  async list(search?: string): Promise<SafeUser[]> {
    const qs = search ? toQueryString({ search }) : ''
    const raw = await httpClient.request<unknown>(`/users${qs}`)
    if (!Array.isArray(raw)) return []
    return sanitizeUsersResponse(raw as UserResponseDto[])
  },

  create(payload: CreateUserDto): Promise<string> {
    return httpClient.request<string>('/users', { method: 'POST', body: payload })
  },

  remove(id: string): Promise<void> {
    return httpClient.request<void>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      parse: 'void',
    })
  },
}
