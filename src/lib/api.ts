import axios from 'axios'
import type {
  Alert,
  DashboardSnapshot,
  Employee,
  EmployeePayload,
  EmployeeSort,
  EmployeesListResponse,
  PerformancePoint,
} from './types'

type FilterableField = keyof Employee | 'fullName'

type FetchEmployeesParams = {
  page?: number;
  pageSize?: number;
  filters?: Partial<Record<FilterableField, string | string[]>>;
  sort?: EmployeeSort;
}

const API_BASE =
  import.meta.env.VITE_API_BASE ?? import.meta.env.REACT_APP_API_BASE ?? import.meta.env.VITE_APP_API_BASE

export const apiClient = axios.create({
  baseURL: API_BASE || undefined,
  timeout: 10_000,
})

const useMock = !API_BASE

const mockEmployees: Employee[] = [
  {
    id: 1,
    firstName: 'Ava',
    lastName: 'Stone',
    email: 'ava.stone@pulse.hr',
    department: 'People Operations',
    role: 'HR Director',
    hireDate: '2021-03-14',
    performanceScore: 92,
  },
  {
    id: 2,
    firstName: 'Marcus',
    lastName: 'Lee',
    email: 'marcus.lee@sales.hr',
    department: 'Sales',
    role: 'People Partner',
    hireDate: '2022-06-20',
    performanceScore: 87,
  },
  {
    id: 3,
    firstName: 'Nia',
    lastName: 'Patel',
    email: 'nia.patel@analytics.hr',
    department: 'Analytics',
    role: 'People Analyst',
    hireDate: '2020-11-05',
    performanceScore: 81,
  },
  {
    id: 4,
    firstName: 'Jonah',
    lastName: 'Berg',
    email: 'jonah.berg@talent.hr',
    department: 'Talent Acquisition',
    role: 'Recruiter',
    hireDate: '2019-01-18',
    performanceScore: 78,
  },
  {
    id: 5,
    firstName: 'Camila',
    lastName: 'Flores',
    email: 'camila.flores@product.hr',
    department: 'Product',
    role: 'HRBP',
    hireDate: '2023-02-10',
    performanceScore: 90,
  },
]
let mockIdCounter = mockEmployees.length + 1

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const matchesFilter = (value: string, filter: string | string[]) => {
  if (Array.isArray(filter)) {
    return filter.some((item) => value.toLowerCase().includes(item.toLowerCase()))
  }
  return value.toLowerCase().includes(filter.toLowerCase())
}

const applyFilters = (data: Employee[], filters?: FetchEmployeesParams['filters']) => {
  if (!filters) return data
  return data.filter((employee) =>
    (Object.entries(filters) as [FilterableField, string | string[]][]).every(([key, filterValue]) => {
      if (!filterValue) return true
      const employeeValue =
        key === 'fullName' ? `${employee.firstName} ${employee.lastName}` : employee[key as keyof Employee]
      if (employeeValue == null) return false
      return matchesFilter(String(employeeValue), filterValue)
    }),
  )
}

const applySort = (data: Employee[], sort?: EmployeeSort) => {
  if (!sort?.field || !sort.order) return data
  return [...data].sort((a, b) => {
    const valueA = a[sort.field!]
    const valueB = b[sort.field!]
    if (valueA === valueB) return 0
    const comparison = valueA > valueB ? 1 : -1
    return sort.order === 'ascend' ? comparison : -comparison
  })
}

const paginate = (data: Employee[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize
  return data.slice(start, start + pageSize)
}

const fetchEmployeesMock = async ({
  page = 1,
  pageSize = 10,
  filters,
  sort,
}: FetchEmployeesParams = {}): Promise<EmployeesListResponse> => {
  await wait()
  const filtered = applyFilters(mockEmployees, filters)
  const sorted = applySort(filtered, sort)
  const paginated = paginate(sorted, page, pageSize)
  return {
    data: paginated,
    total: filtered.length,
    page,
    pageSize,
  }
}

const createEmployeeMock = async (payload: EmployeePayload): Promise<Employee> => {
  await wait()
  const newEmployee: Employee = {
    id: mockIdCounter++,
    ...payload,
  }
  mockEmployees.unshift(newEmployee)
  return newEmployee
}

const updateEmployeeMock = async (id: number, payload: Partial<EmployeePayload>): Promise<Employee> => {
  await wait()
  const index = mockEmployees.findIndex((employee) => employee.id === id)
  if (index === -1) {
    throw new Error('Employee not found')
  }
  mockEmployees[index] = { ...mockEmployees[index], ...payload }
  return mockEmployees[index]
}

const deleteEmployeeMock = async (id: number) => {
  await wait()
  const index = mockEmployees.findIndex((employee) => employee.id === id)
  if (index === -1) {
    throw new Error('Employee not found')
  }
  mockEmployees.splice(index, 1)
}

const deleteEmployeesBulkMock = async (ids: number[]) => {
  await wait()
  ids.forEach((id) => {
    const index = mockEmployees.findIndex((employee) => employee.id === id)
    if (index !== -1) {
      mockEmployees.splice(index, 1)
    }
  })
}

const performanceSeries: PerformancePoint[] = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 85 },
  { month: 'Mar', score: 86 },
  { month: 'Apr', score: 88 },
  { month: 'May', score: 84 },
  { month: 'Jun', score: 89 },
  { month: 'Jul', score: 91 },
  { month: 'Aug', score: 90 },
  { month: 'Sep', score: 92 },
  { month: 'Oct', score: 89 },
  { month: 'Nov', score: 93 },
  { month: 'Dec', score: 95 },
]

const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    message: '2 performance reviews overdue in Sales.',
    severity: 'warning',
  },
  {
    id: 'ALT-002',
    message: 'Payroll anomalies detected for November.',
    severity: 'critical',
  },
  {
    id: 'ALT-003',
    message: 'New onboarding task requires approval.',
    severity: 'info',
  },
]

const withLatency = async <T>(payload: T, delay = 400) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const employees = mockEmployees.length
  const performance =
    performanceSeries.reduce((acc, point) => acc + point.score, 0) /
    performanceSeries.length

  return withLatency({
    employees,
    performance: Math.round(performance),
    alerts: mockAlerts.length,
    performanceTrend: 4.6,
  })
}

export const fetchEmployees = async (params?: FetchEmployeesParams): Promise<EmployeesListResponse> => {
  if (useMock) {
    return fetchEmployeesMock(params)
  }
  const response = await apiClient.get<EmployeesListResponse>('/employees', { params })
  return response.data
}

export const fetchEmployeeById = async (employeeId: string): Promise<Employee | undefined> => {
  if (useMock) {
    await wait(250)
    return mockEmployees.find((employee) => employee.id === Number(employeeId))
  }
  const response = await apiClient.get<Employee>(`/employees/${employeeId}`)
  return response.data
}

export const createEmployee = async (payload: EmployeePayload): Promise<Employee> => {
  if (useMock) {
    return createEmployeeMock(payload)
  }
  const response = await apiClient.post<Employee>('/employees', payload)
  return response.data
}

export const updateEmployee = async (id: number, payload: Partial<EmployeePayload>): Promise<Employee> => {
  if (useMock) {
    return updateEmployeeMock(id, payload)
  }
  const response = await apiClient.put<Employee>(`/employees/${id}`, payload)
  return response.data
}

export const deleteEmployee = async (id: number) => {
  if (useMock) {
    return deleteEmployeeMock(id)
  }
  await apiClient.delete(`/employees/${id}`)
}

export const deleteEmployeesBulk = async (ids: number[]) => {
  if (useMock) {
    return deleteEmployeesBulkMock(ids)
  }
  await apiClient.post('/employees/bulk-delete', { ids })
}

export const fetchPerformanceSeries = async (): Promise<PerformancePoint[]> => {
  return withLatency(performanceSeries)
}

export const fetchAlerts = async (): Promise<Alert[]> => {
  return withLatency(mockAlerts)
}


