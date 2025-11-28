export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated'

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  performance: number;
  alerts: number;
}

export type PerformancePoint = {
  month: string;
  score: number;
}

export type DashboardSnapshot = {
  employees: number;
  performance: number;
  alerts: number;
  performanceTrend: number;
}

export type Alert = {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}


