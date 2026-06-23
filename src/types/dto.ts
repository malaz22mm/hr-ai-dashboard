/** Transport contracts — defensive at integration boundaries (backend may add/shape-shift fields). */

export type TokensDto = {
  access_token: string
  refresh_token: string
}

export type VerificationRequiredDto = {
  verificationId: string
  message: string
}

export type SignInDto = {
  email?: string
  phone?: string
  password: string
}

export type VerifyAccountDto = {
  userId: string
  code: number
}

export type UserIdDto = {
  userId: string
}

export type ResetPasswordDto = {
  userId: string
  code: number
  email: string
  newPassword: string
}

export type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE'

export type UserResponseDto = {
  id: string
  name: string
  role: UserRole
  approvalState: 'VERIFIED' | 'NOT_VERIFIED'
  email: string
  phone?: unknown
  createdAt: string
  updatedAt: string
} & Record<string, unknown>

export type CreateUserDto = {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole
}

export type PaginationMetaDto = {
  total: number
  skip: number
  take: number
  pages?: number
}

/** Swagger EmployeeEntity — snake_case employee row. */
export type EmployeeEntity = {
  id: number
  name: string
  name_code: string
  attrition: boolean
  age: number
  gender: boolean
  distance_from_home: number
  hourly_rate: number
  daily_rate: number
  monthly_rate: number
  monthly_income: number
  percent_salary_hike: number
  job_level: number
  num_of_companies_worked: number
  total_working_years: number
  training_times_last_year: number
  training_hours_last_year: number
  training_hours_last_6_months: number
  training_gap_score: number
  years_at_company: number
  years_in_current_role: number
  years_since_last_promotion: number
  years_with_curr_manager: number
  stock_option_level: number
  over_time: boolean
  workload_pressure_index: number
  engagement_score: number
  engagement_feedback_score: number
  promotion_stagnation_ratio: number
  role_stability_ratio: number
  marital_status_id: number
  job_role_id: number
  business_travel_id: number
  department_id: number
  education_id: number
  performance_rating_id: number
  attrition_risk_class_id: number
  work_shift_id: number
  environment_satisfaction_id: number
  job_involvement_id: number
  job_satisfaction_id: number
  relationship_satisfaction_id: number
  work_life_balance_id: number
}

export type CreateEmployeeDto = Omit<EmployeeEntity, 'id'>
export type UpdateEmployeeDto = EmployeeEntity

/** Raw employee row (snake_case / relations may vary at runtime). */
export type EmployeeRecord = EmployeeEntity & Record<string, unknown>

export type PaginatedEmployeesResponseDto = {
  data: EmployeeRecord[]
  meta: PaginationMetaDto
}

export type EmployeeStatsGroupDto = {
  group: number
  count: number
  averageSalary: number
  averageAge: number
  averageTenure: number
  avgEngagement: number
  avgWorkload: number
}

export type EmployeeStatsGroupBy =
  | 'department_id'
  | 'job_role_id'
  | 'education_id'
  | 'marital_status_id'
  | 'business_travel_id'
  | 'work_shift_id'
  | 'attrition_risk_class_id'
  | 'performance_rating_id'

/** GET /employees/:id/predictions/attrition — live ML inference (separate from HR attrition_risk_class_id). */
export type AttritionPredictionDto = {
  employeeId: number
  employeeName: string
  predictedAttrition: boolean
  attritionProbability: number
  riskLevel: 'Low' | 'Medium' | 'High'
  suggestedAttritionRiskClassId: number
  modelVersion: string
  computedAt: string
}

export type LookupItemDto = {
  id: number
  name: string
  name_code: string
}

export type WorkShiftDto = {
  id: number
  shift_name: string
  start_time: string
  end_time: string
  grace_period_minutes: number
}

export type PunchDto = {
  empId: number
}

export type CreateVacationRequestDto = {
  empId: number
  startDate: string
  endDate: string
  reason: string
}

export type ProcessVacationRequestDto = {
  adminId: string
  statusId: 1 | 2
}

export type AttendanceLogDto = {
  id: number
  emp_id: number
  shift_id: number
  check_in: string
  check_out: string | null
  WorkShift?: WorkShiftDto
}

export type AttendancePresenceDto = {
  emp_id: number
  employee?: { id: number; name: string }
  check_in: string
  shift_id?: number
} & Record<string, unknown>

export type VacationRequestDto = {
  id: number
  emp_id: number
  start_date: string
  end_date: string
  reason: string
  approval_status: number
  processed_by?: string | null
  processed_at?: string | null
} & Record<string, unknown>

export type VacationStatusFilter = 0 | 1 | 2

export type SignInResult = TokensDto | VerificationRequiredDto

export function isTokensDto(x: unknown): x is TokensDto {
  if (x === null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.access_token === 'string' && typeof o.refresh_token === 'string'
}

export function isVerificationRequiredDto(x: unknown): x is VerificationRequiredDto {
  if (x === null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.verificationId === 'string' && typeof o.message === 'string'
}
