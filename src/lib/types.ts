// Backend Employee Entity Schema
export interface Employee {
  id: string; // UUID
  attrition: 'Yes' | 'No';
  age: number;
  gender: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced';
  distanceFromHome: number;
  monthlyIncome: number;
  percentSalaryHike: number;
  jobLevel: number; // 1-5
  jobRole:
    | 'Sales Executive'
    | 'Research Scientist'
    | 'Laboratory Technician'
    | 'Manufacturing Director'
    | 'Healthcare Representative'
    | 'Manager'
    | 'Sales Representative'
    | 'Research Director'
    | 'Human Resources';
  businessTravel: 'Non-Travel' | 'Travel_Rarely' | 'Travel_Frequently';
  department: 'Research & Development' | 'Sales' | 'Human Resources';
  education: 'Below College' | 'College' | 'Bachelor' | 'Master' | 'Doctor';
  educationField:
    | 'Life Sciences'
    | 'Medical'
    | 'Marketing'
    | 'Technical Degree'
    | 'Human Resources'
    | 'Other';
  numCompaniesWorked: number;
  totalWorkingYears: number;
  trainingTimesLastYear: number;
  trainingHoursLastYear: number;
  trainingHoursLast6Months: number;
  trainingGapScore: number;
  yearsAtCompany: number;
  yearsInCurrentRole: number;
  yearsSinceLastPromotion: number;
  yearsWithCurrManager: number;
  environmentSatisfaction: 'Low' | 'Medium' | 'High' | 'Very High';
  jobInvolvement: 'Low' | 'Medium' | 'High' | 'Very High';
  jobSatisfaction: 'Low' | 'Medium' | 'High' | 'Very High';
  performanceRating: 'Low' | 'Good' | 'Excellent' | 'Outstanding';
  relationshipSatisfaction: 'Low' | 'Medium' | 'High' | 'Very High';
  workLifeBalance: 'Low' | 'Medium' | 'High' | 'Very High';
  overTime: 'Yes' | 'No';
  absenceDaysLastMonth: number;
  absenceDaysLast3Months: number;
  absenceRatio: number;
  lateArrivalsLastMonth: number;
  overtimeHoursLastMonth: number;
  workloadPressureIndex: number;
  engagementScore: number;
  managerFeedbackScore: number;
  roleStabilityRatio: number;
  attritionRiskClass: 'Low' | 'Medium' | 'High';
}

// Backend response structure
export interface EmployeesListResponse {
  data: Employee[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

// Query parameters for GET /employees
export interface EmployeesQueryParams {
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Enum filters
  attrition?: 'Yes' | 'No';
  businessTravel?: 'Non-Travel' | 'Travel_Rarely' | 'Travel_Frequently';
  department?: 'Research & Development' | 'Sales' | 'Human Resources';
  education?: 'Below College' | 'College' | 'Bachelor' | 'Master' | 'Doctor';
  educationField?:
    | 'Life Sciences'
    | 'Medical'
    | 'Marketing'
    | 'Technical Degree'
    | 'Human Resources'
    | 'Other';
  jobRole?:
    | 'Sales Executive'
    | 'Research Scientist'
    | 'Laboratory Technician'
    | 'Manufacturing Director'
    | 'Healthcare Representative'
    | 'Manager'
    | 'Sales Representative'
    | 'Research Director'
    | 'Human Resources';
  maritalStatus?: 'Single' | 'Married' | 'Divorced';
  overTime?: 'Yes' | 'No';
  attritionRiskClass?: 'Low' | 'Medium' | 'High';
  gender?: string;
  environmentSatisfaction?: 'Low' | 'Medium' | 'High' | 'Very High';
  jobInvolvement?: 'Low' | 'Medium' | 'High' | 'Very High';
  jobSatisfaction?: 'Low' | 'Medium' | 'High' | 'Very High';
  performanceRating?: 'Low' | 'Good' | 'Excellent' | 'Outstanding';
  relationshipSatisfaction?: 'Low' | 'Medium' | 'High' | 'Very High';
  workLifeBalance?: 'Low' | 'Medium' | 'High' | 'Very High';
  // Range filters
  minAge?: number;
  maxAge?: number;
  minJobLevel?: number;
  maxJobLevel?: number;
  minMonthlyIncome?: number;
  maxMonthlyIncome?: number;
  minPercentSalaryHike?: number;
  maxPercentSalaryHike?: number;
  minTotalWorkingYears?: number;
  maxTotalWorkingYears?: number;
  minNumCompaniesWorked?: number;
  maxNumCompaniesWorked?: number;
  minYearsAtCompany?: number;
  maxYearsAtCompany?: number;
  minYearsInCurrentRole?: number;
  maxYearsInCurrentRole?: number;
  minYearsSinceLastPromotion?: number;
  maxYearsSinceLastPromotion?: number;
  minYearsWithCurrManager?: number;
  maxYearsWithCurrManager?: number;
  minTrainingTimesLastYear?: number;
  maxTrainingTimesLastYear?: number;
  minTrainingHoursLastYear?: number;
  maxTrainingHoursLastYear?: number;
  minTrainingHoursLast6Months?: number;
  maxTrainingHoursLast6Months?: number;
  minTrainingGapScore?: number;
  maxTrainingGapScore?: number;
  minDistanceFromHome?: number;
  maxDistanceFromHome?: number;
  minAbsenceDaysLastMonth?: number;
  maxAbsenceDaysLastMonth?: number;
  minAbsenceDaysLast3Months?: number;
  maxAbsenceDaysLast3Months?: number;
  minAbsenceRatio?: number;
  maxAbsenceRatio?: number;
  minLateArrivalsLastMonth?: number;
  maxLateArrivalsLastMonth?: number;
  minOvertimeHoursLastMonth?: number;
  maxOvertimeHoursLastMonth?: number;
  minWorkloadPressureIndex?: number;
  maxWorkloadPressureIndex?: number;
  minEngagementScore?: number;
  maxEngagementScore?: number;
  minManagerFeedbackScore?: number;
  maxManagerFeedbackScore?: number;
  minRoleStabilityRatio?: number;
  maxRoleStabilityRatio?: number;
}

// DTOs for create/update
export type CreateEmployeeDto = Omit<Employee, 'id'>;
export type UpdateEmployeeDto = Employee; // Includes id

// Legacy types for backward compatibility (deprecated - use Employee)
export type EmployeePayload = CreateEmployeeDto;
export type EmployeeSort = {
  field?: string;
  order?: 'ascend' | 'descend';
};

// Auth types
export interface SignInDto {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
}

export interface VerificationResponse {
  verificationId: string;
  message: string;
}

export type AuthResponse = SignInResponse | VerificationResponse;

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// Other types
export type PerformancePoint = {
  month: string;
  score: number;
};

export type DashboardSnapshot = {
  employees: number;
  performance: number;
  alerts: number;
  performanceTrend: number;
};

export type Alert = {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
};
