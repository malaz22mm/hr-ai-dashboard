import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { emitSessionExpired } from '@/auth/sessionEvents'
import { tokenStorage } from '@/auth/tokenStorage'
import { getApiBaseUrl } from '@/api/env'
import { refreshTokenPair } from '@/api/refreshMutex'
import { normalizeEmployeeStatsRows } from './employees/statsNormalizer'
import type { EmployeeStatsGroupDto } from '@/types/dto'
import type { ApiEmployeesListResponse, ApiStatsGroupBy } from './employees/apiTypes'
import {
  mapApiEmployeeToEmployee,
  mapCreateEmployeeToApi,
  mapEmployeesQueryToApi,
  mapUpdateEmployeeToApi,
} from './employees/mapper'
import { ensureLookups, invalidateLookups, type LookupMaps } from './employees/lookups'
import type {
  Alert,
  AuthResponse,
  CreateEmployeeDto,
  CreateUserDto,
  DashboardSnapshot,
  Employee,
  EmployeeStatsGroupBy,
  EmployeeStatsRow,
  EmployeesListResponse,
  EmployeesQueryParams,
  PerformancePoint,
  RefreshTokenResponse,
  ResetPasswordDto,
  SignInDto,
  UpdateEmployeeDto,
  User,
  UserIdDto,
  VerifingDto,
} from './types'

export const API_BASE = getApiBaseUrl()

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export { tokenStorage }

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const url = originalRequest?.url ?? ''
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (url.includes('/auth/refresh') || url.includes('/auth/local/signin') || url.includes('/auth/verify')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        const pair = await refreshTokenPair()
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${pair.access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        emitSessionExpired()
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// ==================== AUTH ====================

export const signIn = async (payload: SignInDto): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/local/signin', payload)
  return response.data
}

export const refreshTokens = async (_refreshToken: string): Promise<RefreshTokenResponse> => {
  return refreshTokenPair()
}

export const logout = async (_refreshToken?: string): Promise<void> => {
  const access = tokenStorage.getAccessToken()
  if (access) {
    try {
      await apiClient.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${access}` },
        // 204 No Content
        validateStatus: (status) => status === 204 || status === 401,
      })
    } catch {
      /* ignore */
    }
  }
  tokenStorage.clearTokens()
}

export const verifyAccount = async (payload: VerifingDto): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>('/auth/verify', payload)
  return response.data
}

export const resendVerificationCode = async (payload: UserIdDto): Promise<void> => {
  await apiClient.post('/auth/resend-verification-code', payload)
}

export const requestResetPassword = async (payload: UserIdDto): Promise<void> => {
  await apiClient.post('/auth/request-reset-password', payload)
}

export const resetPassword = async (payload: ResetPasswordDto): Promise<void> => {
  await apiClient.post('/auth/reset-password', payload)
}

// ==================== USERS ====================

export const fetchUsers = async (search?: string): Promise<User[]> => {
  const { usersApi } = await import('@/api/resources/usersApi')
  const safe = await usersApi.list(search)
  return safe.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    role: u.role,
    approvalState: u.approvalState,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }))
}

export const createUser = async (payload: CreateUserDto): Promise<void> => {
  await apiClient.post('/users', payload)
}

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`)
}

// ==================== EMPLOYEES (live API: snake_case + lookup IDs) ====================

const API_PAGE_SIZE = 10

const STATS_GROUP_BY_API: Record<EmployeeStatsGroupBy, ApiStatsGroupBy> = {
  department: 'department_id',
  jobRole: 'job_role_id',
  education: 'education_id',
  attritionRiskClass: 'attrition_risk_class_id',
}

let cachedEmployeesDataset: Employee[] | null = null
let employeesDatasetPromise: Promise<Employee[]> | null = null

export function invalidateEmployeesDataset() {
  cachedEmployeesDataset = null
  employeesDatasetPromise = null
}

function sortEmployeesInMemory(
  employees: Employee[],
  sortBy: keyof Employee | string,
  sortOrder: 'asc' | 'desc' = 'asc',
): Employee[] {
  const sorted = [...employees].sort((a, b) => {
    const left = a[sortBy as keyof Employee]
    const right = b[sortBy as keyof Employee]
    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1
    if (typeof left === 'number' && typeof right === 'number') return left - right
    return String(left).localeCompare(String(right))
  })
  return sortOrder === 'desc' ? sorted.reverse() : sorted
}

async function mapEmployeesResponse(raw: ApiEmployeesListResponse): Promise<EmployeesListResponse> {
  const lookups = await ensureLookups()
  return {
    data: raw.data.map((row) => mapApiEmployeeToEmployee(row, lookups)),
    meta: raw.meta,
  }
}

async function fetchEmployeesRaw(params?: EmployeesQueryParams): Promise<EmployeesListResponse> {
  const lookups = await ensureLookups()
  const apiParams = mapEmployeesQueryToApi(params, lookups)
  const take = Math.min(apiParams.take ?? API_PAGE_SIZE, API_PAGE_SIZE)
  const response = await apiClient.get<ApiEmployeesListResponse>('/employees', {
    params: { ...apiParams, take },
  })
  return mapEmployeesResponse(response.data)
}

async function fetchAllEmployeesPaginated(): Promise<Employee[]> {
  const all: Employee[] = []
  let skip = 0

  while (true) {
    const page = await fetchEmployeesRaw({ skip, take: API_PAGE_SIZE })
    all.push(...page.data)
    if (all.length >= page.meta.total || page.data.length === 0) break
    skip += API_PAGE_SIZE
  }

  return all
}

async function loadEmployeesDataset(): Promise<Employee[]> {
  if (cachedEmployeesDataset) return cachedEmployeesDataset
  if (!employeesDatasetPromise) {
    employeesDatasetPromise = fetchAllEmployeesPaginated()
      .then((rows) => {
        cachedEmployeesDataset = rows
        return rows
      })
      .finally(() => {
        employeesDatasetPromise = null
      })
  }
  return employeesDatasetPromise
}

function aggregateEmployeeStats(
  employees: Employee[],
  groupBy: EmployeeStatsGroupBy,
): EmployeeStatsRow[] {
  const groups = new Map<string, Employee[]>()

  for (const employee of employees) {
    const key = String(employee[groupBy] ?? 'Unknown')
    const bucket = groups.get(key)
    if (bucket) bucket.push(employee)
    else groups.set(key, [employee])
  }

  const average = (values: number[]) => {
    if (values.length === 0) return null
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  const satisfactionScore = (label: string) => {
    const map: Record<string, number> = { Low: 1, Medium: 2, High: 3, 'Very High': 4 }
    return map[label] ?? 2
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    [groupBy]: label,
    _count: { id: items.length },
    _avg: {
      monthlyIncome: average(items.map((e) => e.monthlyIncome)),
      age: average(items.map((e) => e.age)),
      jobSatisfaction: average(items.map((e) => satisfactionScore(e.jobSatisfaction))),
    },
  }))
}

function mapStatsDtoToRows(
  rows: EmployeeStatsGroupDto[],
  groupBy: EmployeeStatsGroupBy,
  lookups: LookupMaps,
): EmployeeStatsRow[] {
  const labelMap =
    groupBy === 'department'
      ? lookups.departments
      : groupBy === 'jobRole'
        ? lookups.jobRoles
        : groupBy === 'education'
          ? lookups.educationLevels
          : lookups.attritionRiskClasses

  return rows.map((row) => ({
    [groupBy]: labelMap.get(row.group) ?? String(row.group),
    _count: { id: row.count },
    _avg: {
      monthlyIncome: row.averageSalary ?? null,
      age: row.averageAge ?? null,
      jobSatisfaction: row.avgEngagement ?? null,
    },
  }))
}

export const fetchEmployees = async (
  params?: EmployeesQueryParams,
): Promise<EmployeesListResponse> => fetchEmployeesRaw(params)

export const fetchEmployeeStats = async (
  groupBy: EmployeeStatsGroupBy,
): Promise<EmployeeStatsRow[]> => {
  const apiGroupBy = STATS_GROUP_BY_API[groupBy]
  try {
    const lookups = await ensureLookups()
    const response = await apiClient.get<unknown>('/employees/stats', {
      params: { groupBy: apiGroupBy },
    })
    const normalized = normalizeEmployeeStatsRows(response.data)
    return mapStatsDtoToRows(normalized, groupBy, lookups)
  } catch {
    const employees = await loadEmployeesDataset()
    return aggregateEmployeeStats(employees, groupBy)
  }
}

export const createEmployee = async (payload: CreateEmployeeDto): Promise<Employee> => {
  const lookups = await ensureLookups()
  const response = await apiClient.post('/employees', mapCreateEmployeeToApi(payload, lookups))
  invalidateEmployeesDataset()
  invalidateLookups()
  return mapApiEmployeeToEmployee(response.data, lookups)
}

export const updateEmployee = async (payload: UpdateEmployeeDto): Promise<Employee> => {
  const lookups = await ensureLookups()
  const response = await apiClient.put('/employees', mapUpdateEmployeeToApi(payload, lookups))
  invalidateEmployeesDataset()
  invalidateLookups()
  return mapApiEmployeeToEmployee(response.data, lookups)
}

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/employees/${Number(id)}`)
  invalidateEmployeesDataset()
}

export const deleteEmployeesBulk = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map((id) => deleteEmployee(id)))
}

function statsRowLabel(row: EmployeeStatsRow, groupBy: EmployeeStatsGroupBy): string {
  return (
    row[groupBy] ??
    row.department ??
    row.jobRole ??
    row.education ??
    row.attritionRiskClass ??
    'Unknown'
  )
}

export function mapStatsToPerformancePoints(
  rows: EmployeeStatsRow[],
  groupBy: EmployeeStatsGroupBy,
): PerformancePoint[] {
  return rows.map((row) => ({
    month: statsRowLabel(row, groupBy),
    score: Math.round((row._avg.jobSatisfaction ?? 0) * 20),
  }))
}

// ==================== DASHBOARD (single dataset load — no broken API params) ====================

export type DashboardBundle = {
  topPerformers: Employee[]
  performanceSeries: PerformancePoint[]
  alerts: Alert[]
  snapshot: DashboardSnapshot
}

function buildAlertsFromEmployees(highRisk: Employee[]): Alert[] {
  if (highRisk.length === 0) {
    return [
      {
        id: 'none',
        message: 'No high attrition-risk employees at the moment.',
        severity: 'info',
      },
    ]
  }

  return highRisk.slice(0, 5).map((employee) => ({
    id: employee.id,
    message: `${employee.name} · ${employee.jobRole} (${employee.department}) — engagement ${employee.engagementScore}, risk ${employee.attritionRiskClass}`,
    severity: 'critical' as const,
  }))
}

/** One paginated employees load powers the entire dashboard (avoids duplicate failing requests). */
export const fetchDashboardBundle = async (): Promise<DashboardBundle> => {
  const employees = await loadEmployeesDataset()
  const deptStats = aggregateEmployeeStats(employees, 'department')
  const avgSatisfaction =
    deptStats.length > 0
      ? deptStats.reduce((sum, row) => sum + (row._avg.jobSatisfaction ?? 0), 0) / deptStats.length
      : 0
  const performance = Math.round(avgSatisfaction * 20)
  const highRisk = employees.filter((e) => e.attritionRiskClass === 'High')
  const lowEngagementHighRisk = sortEmployeesInMemory(highRisk, 'engagementScore', 'asc')

  return {
    topPerformers: sortEmployeesInMemory(employees, 'engagementScore', 'desc').slice(0, 5),
    performanceSeries: mapStatsToPerformancePoints(deptStats, 'department'),
    alerts: buildAlertsFromEmployees(lowEngagementHighRisk),
    snapshot: {
      employees: employees.length,
      performance,
      alerts: highRisk.length,
      performanceTrend: Math.round((avgSatisfaction - 3) * 10) / 10,
    },
  }
}

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const { snapshot } = await fetchDashboardBundle()
  return snapshot
}

export const fetchPerformanceSeries = async (): Promise<PerformancePoint[]> => {
  const { performanceSeries } = await fetchDashboardBundle()
  return performanceSeries
}

export const fetchTopPerformers = async (limit = 5): Promise<Employee[]> => {
  const { topPerformers } = await fetchDashboardBundle()
  return topPerformers.slice(0, limit)
}

export const fetchAlerts = async (): Promise<Alert[]> => {
  const { alerts } = await fetchDashboardBundle()
  return alerts
}
