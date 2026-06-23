import { httpClient } from '@/api/httpClient'
import { employeesApi } from '@/api/resources/employeesApi'
import type {
  CreateEmployeeUserAccountDto,
  EmployeePickerItem,
} from '@/types/createEmployeeUserAccount'

function toPickerItem(row: Record<string, unknown>): EmployeePickerItem | null {
  const id = typeof row.id === 'number' ? row.id : Number(row.id)
  if (!Number.isFinite(id) || id < 0) return null
  return {
    id,
    name: String(row.name ?? ''),
    name_code: String(row.name_code ?? ''),
  }
}

export const employeeUserAccountApi = {
  async listEmployeesForPicker(): Promise<EmployeePickerItem[]> {
    const response = await employeesApi.list({ skip: 0, take: 100 })
    return response.data
      .map((row) => toPickerItem(row as Record<string, unknown>))
      .filter((item): item is EmployeePickerItem => item !== null)
  },

  create(payload: CreateEmployeeUserAccountDto): Promise<string> {
    return httpClient.request<string>('/users', {
      method: 'POST',
      body: payload,
    })
  },
}
