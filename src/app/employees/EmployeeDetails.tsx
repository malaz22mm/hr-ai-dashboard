import { Link, useLocation, useParams } from 'react-router-dom'
import { Tag, Card, Row, Col, Button, Result } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { EmployeeAttendanceVacationPanel } from '@/components/EmployeeAttendanceVacationPanel'
import { MlAttritionPredictionCard } from '@/components/MlAttritionPredictionCard'
import type { EmployeeDetailsLocationState } from '@/lib/types'

function isValidEmployeeState(
  state: unknown,
  employeeId: string | undefined,
): state is EmployeeDetailsLocationState {
  if (!employeeId || !state || typeof state !== 'object') return false
  const candidate = state as EmployeeDetailsLocationState
  return Boolean(candidate.employee?.id && candidate.employee.id === employeeId)
}

export default function EmployeeDetails() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const location = useLocation()
  const employee = isValidEmployeeState(location.state, employeeId)
    ? location.state.employee
    : null

  const numericEmpId = employeeId ? Number(employeeId) : NaN
  const hasValidEmpId = Number.isFinite(numericEmpId) && numericEmpId >= 0

  if (!employeeId) {
    return (
      <Result
        status="warning"
        title="No employee selected"
        subTitle="Open a profile from the employee directory."
        extra={
          <Link to="/employees">
            <Button type="primary" icon={<ArrowLeftOutlined />}>
              Back to Employee Directory
            </Button>
          </Link>
        }
      />
    )
  }

  if (!employee && !hasValidEmpId) {
    return (
      <Result
        status="info"
        title="Profile unavailable"
        subTitle="Employee details are only available when opened from the directory. Refreshing or using a direct link does not load profile data until a dedicated API endpoint exists."
        extra={
          <Link to="/employees">
            <Button type="primary" icon={<ArrowLeftOutlined />}>
              Back to Employee Directory
            </Button>
          </Link>
        }
      />
    )
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Employee #{numericEmpId}</h1>
            <p className="mt-1 text-base text-muted-foreground">
              HR profile data unavailable — attendance and vacation APIs still work.
            </p>
          </div>
          <Link to="/employees">
            <Button icon={<ArrowLeftOutlined />}>Back to directory</Button>
          </Link>
        </header>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <MlAttritionPredictionCard employeeId={numericEmpId} />
          </Col>
        </Row>
        <EmployeeAttendanceVacationPanel empId={numericEmpId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Employee Details</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {employee.jobRole} · {employee.department}
          </p>
        </div>
        <Link to="/employees">
          <Button icon={<ArrowLeftOutlined />}>Back to directory</Button>
        </Link>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Basic Information">
            <p>
              <strong>Employee ID:</strong> {employee.id}
            </p>
            <p>
              <strong>Gender:</strong> {employee.gender}
            </p>
            <p>
              <strong>Age:</strong> {employee.age}
            </p>
            <p>
              <strong>Marital Status:</strong> {employee.maritalStatus}
            </p>
            <p>
              <strong>Distance From Home:</strong> {employee.distanceFromHome} km
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Job Information">
            <p>
              <strong>Department:</strong> {employee.department}
            </p>
            <p>
              <strong>Job Role:</strong> {employee.jobRole}
            </p>
            <p>
              <strong>Job Level:</strong> {employee.jobLevel}
            </p>
            <p>
              <strong>Business Travel:</strong> {employee.businessTravel}
            </p>
            <p>
              <strong>Over Time:</strong> {employee.overTime}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Education & Experience">
            <p>
              <strong>Education:</strong> {employee.education}
            </p>
            <p>
              <strong>Education Field:</strong> {employee.educationField}
            </p>
            <p>
              <strong>Total Working Years:</strong> {employee.totalWorkingYears}
            </p>
            <p>
              <strong>Years at Company:</strong> {employee.yearsAtCompany}
            </p>
            <p>
              <strong>Years in Current Role:</strong> {employee.yearsInCurrentRole}
            </p>
            <p>
              <strong>Companies Worked:</strong> {employee.numCompaniesWorked}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Compensation">
            <p>
              <strong>Monthly Income:</strong> ${employee.monthlyIncome.toLocaleString()}
            </p>
            <p>
              <strong>Percent Salary Hike:</strong> {employee.percentSalaryHike}%
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Satisfaction & Performance">
            <p>
              <strong>Environment Satisfaction:</strong>{' '}
              <Tag>{employee.environmentSatisfaction}</Tag>
            </p>
            <p>
              <strong>Job Satisfaction:</strong> <Tag>{employee.jobSatisfaction}</Tag>
            </p>
            <p>
              <strong>Job Involvement:</strong> <Tag>{employee.jobInvolvement}</Tag>
            </p>
            <p>
              <strong>Relationship Satisfaction:</strong>{' '}
              <Tag>{employee.relationshipSatisfaction}</Tag>
            </p>
            <p>
              <strong>Work Life Balance:</strong> <Tag>{employee.workLifeBalance}</Tag>
            </p>
            <p>
              <strong>Performance Rating:</strong>{' '}
              <Tag
                color={
                  employee.performanceRating === 'Outstanding'
                    ? 'success'
                    : employee.performanceRating === 'Excellent'
                      ? 'cyan'
                      : 'blue'
                }
              >
                {employee.performanceRating}
              </Tag>
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Metrics & Scores">
            <p>
              <strong>Engagement Score:</strong>{' '}
              <Tag
                color={
                  employee.engagementScore >= 85
                    ? 'success'
                    : employee.engagementScore >= 70
                      ? 'warning'
                      : 'error'
                }
              >
                {employee.engagementScore}
              </Tag>
            </p>
            <p>
              <strong>Manager Feedback Score:</strong> {employee.managerFeedbackScore}
            </p>
            <p>
              <strong>Workload Pressure Index:</strong> {employee.workloadPressureIndex}
            </p>
            <p>
              <strong>Role Stability Ratio:</strong> {employee.roleStabilityRatio.toFixed(2)}
            </p>
            <p>
              <strong>Training Gap Score:</strong> {employee.trainingGapScore}
            </p>
            <p>
              <strong>Attrition Risk Class:</strong>{' '}
              <Tag
                color={
                  employee.attritionRiskClass === 'High'
                    ? 'error'
                    : employee.attritionRiskClass === 'Medium'
                      ? 'warning'
                      : 'success'
                }
              >
                {employee.attritionRiskClass}
              </Tag>
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Attendance & Time (HR metrics)">
            <p>
              <strong>Absence Days Last Month:</strong> {employee.absenceDaysLastMonth}
            </p>
            <p>
              <strong>Absence Days Last 3 Months:</strong> {employee.absenceDaysLast3Months}
            </p>
            <p>
              <strong>Absence Ratio:</strong> {employee.absenceRatio.toFixed(2)}
            </p>
            <p>
              <strong>Late Arrivals Last Month:</strong> {employee.lateArrivalsLastMonth}
            </p>
            <p>
              <strong>Overtime Hours Last Month:</strong> {employee.overtimeHoursLastMonth}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Training">
            <p>
              <strong>Training Times Last Year:</strong> {employee.trainingTimesLastYear}
            </p>
            <p>
              <strong>Training Hours Last Year:</strong> {employee.trainingHoursLastYear}
            </p>
            <p>
              <strong>Training Hours Last 6 Months:</strong> {employee.trainingHoursLast6Months}
            </p>
            <p>
              <strong>Years Since Last Promotion:</strong> {employee.yearsSinceLastPromotion}
            </p>
            <p>
              <strong>Years with Current Manager:</strong> {employee.yearsWithCurrManager}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <MlAttritionPredictionCard employeeId={Number(employee.id)} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-2">
        <Col xs={24}>
          <EmployeeAttendanceVacationPanel empId={Number(employee.id)} employeeName={employee.name} />
        </Col>
      </Row>
    </div>
  )
}
