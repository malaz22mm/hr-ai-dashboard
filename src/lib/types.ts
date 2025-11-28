export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  hireDate: string; // ISO date string
  performanceScore: number;
}

export interface EmployeesListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export type EmployeeFilters = {
  search?: Partial<Record<keyof Employee, string>>;
}

export type EmployeeSort = {
  field?: keyof Employee;
  order?: 'ascend' | 'descend';
}

export type EmployeePayload = Omit<Employee, 'id'>;

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


