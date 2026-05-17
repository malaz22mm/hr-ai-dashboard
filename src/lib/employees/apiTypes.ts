/** Raw employee shape from GET /employees (live API — snake_case, numeric id). */
export interface ApiEmployee {
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

export interface ApiEmployeesListResponse {
  data: ApiEmployee[]
  meta: {
    total: number
    skip: number
    take: number
  }
}

export type ApiCreateEmployeeDto = Omit<ApiEmployee, 'id'>

export type ApiUpdateEmployeeDto = ApiEmployee

/** GET /employees query params (live API). */
export interface ApiEmployeesQueryParams {
  skip?: number
  take?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  attrition?: boolean
  businessTravelId?: number
  departmentId?: number
  educationId?: number
  jobRoleId?: number
  maritalStatusId?: number
  attritionRiskClassId?: number
  workShiftId?: number
  overTime?: boolean
  gender?: boolean
  environmentSatisfactionId?: number
  jobInvolvementId?: number
  jobSatisfactionId?: number
  performanceRatingId?: number
  relationshipSatisfactionId?: number
  workLifeBalanceId?: number
  minAge?: number
  maxAge?: number
  minJobLevel?: number
  maxJobLevel?: number
  minMonthlyIncome?: number
  maxMonthlyIncome?: number
  minEngagementScore?: number
  maxEngagementScore?: number
}

export type ApiStatsGroupBy =
  | 'department_id'
  | 'job_role_id'
  | 'education_id'
  | 'marital_status_id'
  | 'business_travel_id'
  | 'work_shift_id'
  | 'attrition_risk_class_id'
  | 'performance_rating_id'

export type ApiEmployeeStatsRow = {
  department_id?: number
  job_role_id?: number
  education_id?: number
  marital_status_id?: number
  business_travel_id?: number
  work_shift_id?: number
  attrition_risk_class_id?: number
  performance_rating_id?: number
  _count: { id: number }
  _avg: {
    monthly_income?: number | null
    age?: number | null
    job_satisfaction_id?: number | null
  }
}
