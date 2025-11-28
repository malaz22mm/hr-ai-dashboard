import axios from 'axios'
import type { Alert, DashboardSnapshot, Employee, PerformancePoint } from './types'

export const apiClient = axios.create({
  baseURL: 'https://api.placeholder-hr.com',
  timeout: 10_000,
})

const mockEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Ava Stone',
    role: 'HR Director',
    department: 'People Operations',
    status: 'Active',
    performance: 92,
    alerts: 0,
  },
  {
    id: 'EMP-002',
    name: 'Marcus Lee',
    role: 'People Partner',
    department: 'Sales',
    status: 'Active',
    performance: 87,
    alerts: 1,
  },
  {
    id: 'EMP-003',
    name: 'Nia Patel',
    role: 'People Analyst',
    department: 'Analytics',
    status: 'On Leave',
    performance: 81,
    alerts: 0,
  },
  {
    id: 'EMP-004',
    name: 'Jonah Berg',
    role: 'Recruiter',
    department: 'Talent Acquisition',
    status: 'Active',
    performance: 78,
    alerts: 2,
  },
  {
    id: 'EMP-005',
    name: 'Camila Flores',
    role: 'HRBP',
    department: 'Product',
    status: 'Active',
    performance: 90,
    alerts: 0,
  },
]

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

export const fetchEmployees = async (): Promise<Employee[]> => {
  return withLatency(mockEmployees)
}

export const fetchEmployeeById = async (employeeId: string): Promise<Employee | undefined> => {
  const found = mockEmployees.find((employee) => employee.id === employeeId)
  return withLatency(found, 250)
}

export const fetchPerformanceSeries = async (): Promise<PerformancePoint[]> => {
  return withLatency(performanceSeries)
}

export const fetchAlerts = async (): Promise<Alert[]> => {
  return withLatency(mockAlerts)
}


