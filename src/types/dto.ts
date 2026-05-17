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

export type UserRole = 'ADMIN' | 'SUPER_ADMIN'

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

/** Raw employee row (snake_case / relations may vary at runtime). */
export type EmployeeRecord = Record<string, unknown> & {
  id?: number
  name?: string
}

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
