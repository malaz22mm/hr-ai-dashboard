import { httpClient } from '@/api/httpClient'
import type { AttendanceLogDto, AttendancePresenceDto, PunchDto } from '@/types/dto'
import { toQueryString } from '@/utils/queryString'

export type AttendanceHistoryQuery = {
  start?: string
  end?: string
}

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : []
}

export const attendanceApi = {
  punch(payload: PunchDto): Promise<AttendanceLogDto> {
    return httpClient.request<AttendanceLogDto>('/attendance/punch', {
      method: 'POST',
      body: payload,
    })
  },

  presence(): Promise<AttendancePresenceDto[]> {
    return httpClient
      .request<unknown>('/attendance/presence')
      .then((raw) => asArray<AttendancePresenceDto>(raw))
  },

  history(employeeId: number, query: AttendanceHistoryQuery = {}): Promise<AttendanceLogDto[]> {
    const qs = toQueryString(query)
    return httpClient
      .request<unknown>(`/attendance/employee/${employeeId}${qs}`)
      .then((raw) => asArray<AttendanceLogDto>(raw))
  },
}
