import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag, Card, Row, Col, Spin, message } from 'antd'
import { fetchEmployeeById } from '@/lib/api'
import type { Employee } from '@/lib/types'

export default function EmployeeDetails() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return

    const loadEmployee = async () => {
      try {
        setLoading(true)
        const data = await fetchEmployeeById(employeeId)
        setEmployee(data)
      } catch (error) {
        console.error(error)
        message.error('Failed to load employee details')
      } finally {
        setLoading(false)
      }
    }

    loadEmployee()
  }, [employeeId])

  if (!employeeId) {
    return <p className="text-muted-foreground">No employee selected.</p>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!employee) {
    return <p className="text-muted-foreground">Employee not found.</p>
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Employee Details</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {employee.jobRole} · {employee.department}
        </p>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Basic Information">
            <p>
              <strong>Employee ID:</strong> {employee.id.substring(0, 8)}...
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
              <Tag color={employee.engagementScore >= 85 ? 'success' : employee.engagementScore >= 70 ? 'warning' : 'error'}>
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
          <Card title="Attendance & Time">
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
      </Row>
    </div>
  )
}
