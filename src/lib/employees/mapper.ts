import type {
  ApiCreateEmployeeDto,
  ApiEmployee,
  ApiEmployeesQueryParams,
  ApiUpdateEmployeeDto,
} from './apiTypes'
import type { LookupMaps } from './lookups'
import type { CreateEmployeeDto, Employee, EmployeesQueryParams, UpdateEmployeeDto } from '@/lib/types'

function satisfactionLabel(lookups: LookupMaps, id: number): Employee['jobSatisfaction'] {
  const label = lookups.satisfaction.get(id)
  if (label === 'Low' || label === 'Medium' || label === 'High' || label === 'Very High') {
    return label
  }
  return 'Medium'
}

function attritionRiskLabel(lookups: LookupMaps, id: number): Employee['attritionRiskClass'] {
  const label = lookups.attritionRiskClasses.get(id)
  if (label === 'Low' || label === 'Medium' || label === 'High') return label
  return 'Low'
}

export function mapApiEmployeeToEmployee(api: ApiEmployee, lookups: LookupMaps): Employee {
  return {
    id: String(api.id),
    name: api.name,
    attrition: api.attrition ? 'Yes' : 'No',
    age: api.age,
    gender: api.gender ? 'Male' : 'Female',
    maritalStatus: (lookups.maritalStatuses.get(api.marital_status_id) ?? 'Single') as Employee['maritalStatus'],
    distanceFromHome: api.distance_from_home,
    monthlyIncome: api.monthly_income,
    percentSalaryHike: api.percent_salary_hike,
    jobLevel: api.job_level,
    jobRole: (lookups.jobRoles.get(api.job_role_id) ?? 'Unknown') as Employee['jobRole'],
    businessTravel: `Travel #${api.business_travel_id}` as Employee['businessTravel'],
    department: (lookups.departments.get(api.department_id) ?? 'Unknown') as Employee['department'],
    education: (lookups.educationLevels.get(api.education_id) ?? 'College') as Employee['education'],
    educationField: 'Other',
    numCompaniesWorked: api.num_of_companies_worked,
    totalWorkingYears: api.total_working_years,
    trainingTimesLastYear: api.training_times_last_year,
    trainingHoursLastYear: api.training_hours_last_year,
    trainingHoursLast6Months: api.training_hours_last_6_months,
    trainingGapScore: api.training_gap_score,
    yearsAtCompany: api.years_at_company,
    yearsInCurrentRole: api.years_in_current_role,
    yearsSinceLastPromotion: api.years_since_last_promotion,
    yearsWithCurrManager: api.years_with_curr_manager,
    environmentSatisfaction: satisfactionLabel(lookups, api.environment_satisfaction_id),
    jobInvolvement: satisfactionLabel(lookups, api.job_involvement_id),
    jobSatisfaction: satisfactionLabel(lookups, api.job_satisfaction_id),
    performanceRating: 'Good',
    relationshipSatisfaction: satisfactionLabel(lookups, api.relationship_satisfaction_id),
    workLifeBalance: satisfactionLabel(lookups, api.work_life_balance_id),
    overTime: api.over_time ? 'Yes' : 'No',
    absenceDaysLastMonth: 0,
    absenceDaysLast3Months: 0,
    absenceRatio: 0,
    lateArrivalsLastMonth: 0,
    overtimeHoursLastMonth: 0,
    workloadPressureIndex: api.workload_pressure_index,
    engagementScore: api.engagement_score,
    managerFeedbackScore: api.engagement_feedback_score,
    roleStabilityRatio: api.role_stability_ratio,
    attritionRiskClass: attritionRiskLabel(lookups, api.attrition_risk_class_id),
    departmentId: api.department_id,
    jobRoleId: api.job_role_id,
    attritionRiskClassId: api.attrition_risk_class_id,
    educationId: api.education_id,
    maritalStatusId: api.marital_status_id,
    businessTravelId: api.business_travel_id,
    workShiftId: api.work_shift_id,
    environmentSatisfactionId: api.environment_satisfaction_id,
    jobInvolvementId: api.job_involvement_id,
    jobSatisfactionId: api.job_satisfaction_id,
    relationshipSatisfactionId: api.relationship_satisfaction_id,
    workLifeBalanceId: api.work_life_balance_id,
    performanceRatingId: api.performance_rating_id,
  }
}

function slugCode(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function mapCreateEmployeeToApi(
  employee: CreateEmployeeDto,
  lookups: LookupMaps,
): ApiCreateEmployeeDto {
  return {
    name: employee.name,
    name_code: slugCode(employee.name),
    attrition: employee.attrition === 'Yes',
    age: employee.age,
    gender: employee.gender === 'Male' || employee.gender === 'true',
    distance_from_home: employee.distanceFromHome,
    hourly_rate: employee.monthlyIncome / 160,
    daily_rate: employee.monthlyIncome / 20,
    monthly_rate: employee.monthlyIncome,
    monthly_income: employee.monthlyIncome,
    percent_salary_hike: employee.percentSalaryHike,
    job_level: employee.jobLevel,
    num_of_companies_worked: employee.numCompaniesWorked,
    total_working_years: employee.totalWorkingYears,
    training_times_last_year: employee.trainingTimesLastYear,
    training_hours_last_year: employee.trainingHoursLastYear,
    training_hours_last_6_months: employee.trainingHoursLast6Months,
    training_gap_score: employee.trainingGapScore,
    years_at_company: employee.yearsAtCompany,
    years_in_current_role: employee.yearsInCurrentRole,
    years_since_last_promotion: employee.yearsSinceLastPromotion,
    years_with_curr_manager: employee.yearsWithCurrManager,
    stock_option_level: 0,
    over_time: employee.overTime === 'Yes',
    workload_pressure_index: employee.workloadPressureIndex,
    engagement_score: employee.engagementScore,
    engagement_feedback_score: employee.managerFeedbackScore,
    promotion_stagnation_ratio: 0,
    role_stability_ratio: employee.roleStabilityRatio,
    marital_status_id: employee.maritalStatusId ?? lookups.maritalStatuses.keys().next().value ?? 1,
    job_role_id: employee.jobRoleId ?? lookups.jobRolesByName.get(employee.jobRole) ?? 1,
    business_travel_id: employee.businessTravelId ?? 1,
    department_id: employee.departmentId ?? lookups.departmentsByName.get(employee.department) ?? 1,
    education_id: employee.educationId ?? 1,
    performance_rating_id: employee.performanceRatingId ?? 1,
    attrition_risk_class_id:
      employee.attritionRiskClassId ??
      lookups.attritionRiskClassesByName.get(employee.attritionRiskClass) ??
      1,
    work_shift_id: employee.workShiftId ?? 1,
    environment_satisfaction_id:
      employee.environmentSatisfactionId ??
      lookups.satisfaction.entries().next().value?.[0] ??
      3,
    job_involvement_id: employee.jobInvolvementId ?? 3,
    job_satisfaction_id: employee.jobSatisfactionId ?? 3,
    relationship_satisfaction_id: employee.relationshipSatisfactionId ?? 3,
    work_life_balance_id: employee.workLifeBalanceId ?? 3,
  }
}

export function mapUpdateEmployeeToApi(
  employee: UpdateEmployeeDto,
  lookups: LookupMaps,
): ApiUpdateEmployeeDto {
  return {
    ...mapCreateEmployeeToApi(employee, lookups),
    id: Number(employee.id),
  }
}

const UI_SORT_TO_API: Record<string, string> = {
  monthlyIncome: 'monthly_income',
  engagementScore: 'engagement_score',
  jobLevel: 'job_level',
  age: 'age',
  percentSalaryHike: 'percent_salary_hike',
  totalWorkingYears: 'total_working_years',
  yearsAtCompany: 'years_at_company',
  managerFeedbackScore: 'engagement_feedback_score',
  workloadPressureIndex: 'workload_pressure_index',
}

export function mapEmployeesQueryToApi(
  params: EmployeesQueryParams | undefined,
  lookups: LookupMaps,
): ApiEmployeesQueryParams {
  if (!params) return { skip: 0, take: 10 }

  const api: ApiEmployeesQueryParams = {
    skip: params.skip,
    take: params.take,
    sortOrder: params.sortOrder,
  }

  if (params.sortBy) {
    api.sortBy = UI_SORT_TO_API[params.sortBy] ?? params.sortBy
  }

  if (params.attrition === 'Yes') api.attrition = true
  if (params.attrition === 'No') api.attrition = false
  if (params.overTime === 'Yes') api.overTime = true
  if (params.overTime === 'No') api.overTime = false

  if (params.department) {
    const id = lookups.departmentsByName.get(params.department)
    if (id) api.departmentId = id
  }
  if (params.jobRole) {
    const id = lookups.jobRolesByName.get(params.jobRole)
    if (id) api.jobRoleId = id
  }
  if (params.attritionRiskClass) {
    const id = lookups.attritionRiskClassesByName.get(params.attritionRiskClass)
    if (id) api.attritionRiskClassId = id
  }

  if (params.minAge != null) api.minAge = params.minAge
  if (params.maxAge != null) api.maxAge = params.maxAge
  if (params.minJobLevel != null) api.minJobLevel = params.minJobLevel
  if (params.maxJobLevel != null) api.maxJobLevel = params.maxJobLevel
  if (params.minMonthlyIncome != null) api.minMonthlyIncome = params.minMonthlyIncome
  if (params.maxMonthlyIncome != null) api.maxMonthlyIncome = params.maxMonthlyIncome
  if (params.minEngagementScore != null) api.minEngagementScore = params.minEngagementScore
  if (params.maxEngagementScore != null) api.maxEngagementScore = params.maxEngagementScore

  return api
}
