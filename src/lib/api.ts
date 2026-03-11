import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  Alert,
  AuthResponse,
  CreateEmployeeDto,
  DashboardSnapshot,
  Employee,
  EmployeesListResponse,
  EmployeesQueryParams,
  PerformancePoint,
  RefreshTokenResponse,
  SignInDto,
  UpdateEmployeeDto,
} from './types'

const API_BASE = 'https://hr-controlpanel-production.up.railway.app'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
const TOKEN_KEY = 'hr_access_token'
const REFRESH_TOKEN_KEY = 'hr_refresh_token'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// Request interceptor: Attach access token
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

// Response interceptor: Handle 401 and refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string | null) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        tokenStorage.clearTokens()
        processQueue(error, null)
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE}/auth/refresh`,
          refreshToken,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              'Content-Type': 'application/json',
            },
          },
        )

        const { access_token, refresh_token } = response.data
        tokenStorage.setAccessToken(access_token)
        tokenStorage.setRefreshToken(refresh_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        processQueue(null, access_token)
        return apiClient(originalRequest)
      } catch (refreshError) {
        tokenStorage.clearTokens()
        processQueue(refreshError as AxiosError, null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ==================== AUTH ENDPOINTS ====================

export const signIn = async (payload: SignInDto): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/local/signin', payload)
  return response.data
}

export const refreshTokens = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>(
    '/auth/refresh',
    refreshToken,
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  )
  return response.data
}

export const logout = async (refreshToken: string): Promise<void> => {
  await apiClient.post(
    '/auth/logout',
    refreshToken,
    {
      headers: {
        Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
      },
    },
  )
  tokenStorage.clearTokens()
}

// ==================== EMPLOYEES ENDPOINTS ====================

export const fetchEmployees = async (params?: EmployeesQueryParams): Promise<EmployeesListResponse> => {
  const response = await apiClient.get<EmployeesListResponse>('/employees', { params })
  return response.data
}

export const fetchEmployeeById = async (employeeId: string): Promise<Employee> => {
  const response = await apiClient.get<Employee>(`/employees/${employeeId}`)
  return response.data
}

export const createEmployee = async (payload: CreateEmployeeDto): Promise<Employee> => {
  const response = await apiClient.post<Employee>('/employees', payload)
  return response.data
}

export const updateEmployee = async (payload: UpdateEmployeeDto): Promise<Employee> => {
  const response = await apiClient.put<Employee>('/employees', payload)
  return response.data
}

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/employees/${id}`)
}

export const deleteEmployeesBulk = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map((id) => deleteEmployee(id)))
}

// ==================== DASHBOARD ENDPOINTS ====================

// Note: These endpoints may not exist in the backend yet, so they return mock data
// Replace with real endpoints when available
export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  try {
    // Try to get employee count from real API
    const employeesResponse = await fetchEmployees({ take: 1, skip: 0 })
    return {
      employees: employeesResponse.meta.total,
      performance: 87,
      alerts: 3,
      performanceTrend: 4.6,
    }
  } catch {
    return {
      employees: 0,
      performance: 0,
      alerts: 0,
      performanceTrend: 0,
    }
  }
}

export const fetchPerformanceSeries = async (): Promise<PerformancePoint[]> => {
  // Mock data - replace with real endpoint when available
  return Promise.resolve([
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
  ])
}

export const fetchAlerts = async (): Promise<Alert[]> => {
  // Mock data - replace with real endpoint when available
  return Promise.resolve([
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
  ])
}
