/**
 * Contract-aligned types for Talabaty HR API (from swagger-spec + written docs).
 * Extend with relations / unknown fields defensively at integration boundaries.
 */

/** ---------- Auth ---------- */

export type TokensDto = {
  access_token: string;
  refresh_token: string;
};

export type VerificationRequiredDto = {
  verificationId: string;
  message: string;
};

export type SignInDto = {
  email?: string;
  phone?: string;
  password: string;
};

/** OpenAPI schema name: VerifingDto */
export type VerifyAccountDto = {
  userId: string;
  code: number;
};

export type UserIdDto = {
  userId: string;
};

export type ResetPasswordDto = {
  userId: string;
  code: number;
  email: string;
  newPassword: string;
};

/** Narrow helper for sign-in */
export type SignInResult = TokensDto | VerificationRequiredDto;

export function isTokensDto(x: unknown): x is TokensDto {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.access_token === 'string' && typeof o.refresh_token === 'string';
}

export function isVerificationRequiredDto(x: unknown): x is VerificationRequiredDto {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.verificationId === 'string' && typeof o.message === 'string';
}

/** ---------- Users ---------- */

export type UserRole = 'ADMIN' | 'SUPER_ADMIN';
export type ApprovalState = 'VERIFIED' | 'NOT_VERIFIED';

/**
 * Swagger UserResponseDto — runtime may include extra Prisma fields (e.g. hashedPassword).
 * Map to SafeUser for UI.
 */
export type UserResponseDto = {
  id: string;
  name: string;
  role: UserRole;
  approvalState: ApprovalState;
  email: string;
  /** Swagger says object — treat as unknown at boundaries */
  phone?: unknown;
  createdAt: string;
  updatedAt: string;
} & Record<string, unknown>;

/** User row safe for UI — strip secrets and coerce weakly-typed fields */
export type SafeUser = {
  id: string;
  name: string;
  role: UserRole;
  approvalState: ApprovalState;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toSafeUser(row: UserResponseDto): SafeUser {
  const leaked = row as UserResponseDto & { hashedPassword?: unknown };
  void leaked.hashedPassword;
  const phoneRaw = row.phone;
  const phone =
    typeof phoneRaw === 'string'
      ? phoneRaw
      : phoneRaw === null || phoneRaw === undefined
        ? null
        : typeof phoneRaw === 'object' && phoneRaw !== null && 'toString' in phoneRaw
          ? String(phoneRaw)
          : null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    approvalState: row.approvalState,
    email: row.email,
    phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
};

/** ---------- Employees ---------- */

export type PaginationMetaDto = {
  total: number;
  skip: number;
  take: number;
  pages: number;
};

/** Base row from OpenAPI — relations not fully described in schema */
export type EmployeeEntity = {
  id: number;
  name: string;
  name_code: string;
  attrition: boolean;
  age: number;
  gender: boolean;
  distance_from_home: number;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  monthly_income: number;
  percent_salary_hike: number;
  job_level: number;
  num_of_companies_worked: number;
  total_working_years: number;
  training_times_last_year: number;
  training_hours_last_year: number;
  training_hours_last_6_months: number;
  training_gap_score: number;
  years_at_company: number;
  years_in_current_role: number;
  years_since_last_promotion: number;
  years_with_curr_manager: number;
  stock_option_level: number;
  over_time: boolean;
  workload_pressure_index: number;
  engagement_score: number;
  engagement_feedback_score: number;
  promotion_stagnation_ratio: number;
  role_stability_ratio: number;
  marital_status_id: number;
  job_role_id: number;
  business_travel_id: number;
  department_id: number;
  education_id: number;
  performance_rating_id: number;
  attrition_risk_class_id: number;
  work_shift_id: number;
  environment_satisfaction_id: number;
  job_involvement_id: number;
  job_satisfaction_id: number;
  relationship_satisfaction_id: number;
  work_life_balance_id: number;
} & {
  /** Prisma-style relations — optional because OpenAPI is partial */
  Department?: unknown;
  JobRole?: unknown;
  MaritalStatus?: unknown;
  WorkShift?: unknown;
  [key: string]: unknown;
};

export type PaginatedEmployeesResponseDto = {
  data: EmployeeEntity[];
  meta: PaginationMetaDto;
};

export type EmployeeStatsGroupBy =
  | 'department_id'
  | 'job_role_id'
  | 'education_id'
  | 'marital_status_id'
  | 'business_travel_id'
  | 'work_shift_id'
  | 'attrition_risk_class_id'
  | 'performance_rating_id';

export type EmployeeStatsGroupDto = {
  group: number;
  count: number;
  averageSalary: number;
  averageAge: number;
  averageTenure: number;
  avgEngagement: number;
  avgWorkload: number;
};

export type CreateEmployeeDto = Omit<EmployeeEntity, 'id'>;
export type UpdateEmployeeDto = Partial<Omit<EmployeeEntity, 'id'>> & { id: number };

/** Query params are camelCase in HTTP — keep loose for forward compatibility */
export type EmployeeListQuery = {
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} & Record<string, number | boolean | string | undefined>;

/** ---------- Attendance ---------- */

export type PunchDto = {
  empId: number;
};

/** OpenAPI uses generic object[] — refine when samples are stable */
export type AttendanceLog = Record<string, unknown>;
export type PresenceRow = Record<string, unknown>;

/** ---------- Vacations ---------- */

export type CreateVacationRequestDto = {
  empId: number;
  startDate: string;
  endDate: string;
  reason: string;
};

export type ProcessVacationRequestDto = {
  adminId: string;
  statusId: 1 | 2;
};

export type VacationRequest = Record<string, unknown>;

/** ---------- Lookups ---------- */

export type LookupItemDto = {
  id: number;
  name: string;
  name_code: string;
};

export type WorkShiftDto = {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
};

/** ---------- Errors ---------- */

export type NestHttpErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
