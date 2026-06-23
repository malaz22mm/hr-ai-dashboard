import { httpClient } from '@/api/httpClient'
import type {
  CreateVacationRequestDto,
  ProcessVacationRequestDto,
  VacationRequestDto,
  VacationStatusFilter,
} from '@/types/dto'
import { toQueryString } from '@/utils/queryString'

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : []
}

export const vacationsApi = {
  create(payload: CreateVacationRequestDto): Promise<VacationRequestDto> {
    return httpClient.request<VacationRequestDto>('/vacations', {
      method: 'POST',
      body: payload,
    })
  },

  list(status?: VacationStatusFilter): Promise<VacationRequestDto[]> {
    const qs = status !== undefined ? toQueryString({ status }) : ''
    return httpClient
      .request<unknown>(`/vacations${qs}`)
      .then((raw) => asArray<VacationRequestDto>(raw))
  },

  listForEmployee(empId: number): Promise<VacationRequestDto[]> {
    return httpClient
      .request<unknown>(`/vacations/employee/${empId}`)
      .then((raw) => asArray<VacationRequestDto>(raw))
  },

  process(id: number, payload: ProcessVacationRequestDto): Promise<VacationRequestDto> {
    return httpClient.request<VacationRequestDto>(`/vacations/${id}/process`, {
      method: 'PATCH',
      body: payload,
    })
  },
}
