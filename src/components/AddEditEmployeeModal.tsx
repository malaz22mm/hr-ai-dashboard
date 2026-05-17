import { useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber } from 'antd'
import type { CreateEmployeeDto, Employee } from '@/lib/types'

type AddEditEmployeeModalProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateEmployeeDto) => Promise<void> | void;
  employee?: Employee | null;
  departments: string[];
  roles: string[];
}

const ATTRITION_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const BUSINESS_TRAVEL_OPTIONS = [
  { value: 'Non-Travel', label: 'Non-Travel' },
  { value: 'Travel_Rarely', label: 'Travel Rarely' },
  { value: 'Travel_Frequently', label: 'Travel Frequently' },
]

const EDUCATION_OPTIONS = [
  { value: 'Below College', label: 'Below College' },
  { value: 'College', label: 'College' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'Doctor', label: 'Doctor' },
]

const EDUCATION_FIELD_OPTIONS = [
  { value: 'Life Sciences', label: 'Life Sciences' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Technical Degree', label: 'Technical Degree' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Other', label: 'Other' },
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
]

const SATISFACTION_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Very High', label: 'Very High' },
]

const PERFORMANCE_RATING_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Good', label: 'Good' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Outstanding', label: 'Outstanding' },
]

const ATTRITION_RISK_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

export function AddEditEmployeeModal({
  open,
  onCancel,
  onSubmit,
  employee,
  departments,
  roles,
}: AddEditEmployeeModalProps) {
  const [form] = Form.useForm<CreateEmployeeDto>()

  useEffect(() => {
    if (employee) {
      form.setFieldsValue(employee)
    } else {
      form.resetFields()
      // Set default values for new employee
      form.setFieldsValue({
        attrition: 'No',
        overTime: 'No',
        attritionRiskClass: 'Low',
        environmentSatisfaction: 'Medium',
        jobInvolvement: 'Medium',
        jobSatisfaction: 'Medium',
        performanceRating: 'Good',
        relationshipSatisfaction: 'Medium',
        workLifeBalance: 'Medium',
      })
    }
  }, [employee, form])

  const handleFinish = async (values: CreateEmployeeDto) => {
    await onSubmit(values)
    form.resetFields()
  }

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields()
        onCancel()
      }}
      title={employee ? 'Edit employee' : 'Add new employee'}
      okText={employee ? 'Save changes' : 'Create employee'}
      onOk={() => form.submit()}
      destroyOnClose
      maskClosable={false}
      centered
      width={800}
      style={{ maxHeight: '90vh', overflowY: 'auto' }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        className="max-h-[70vh] overflow-y-auto pr-2"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Full name" name="name" rules={[{ required: true }]} className="col-span-2">
            <Input placeholder="Employee name" />
          </Form.Item>

          <Form.Item label="Department" name="department" rules={[{ required: true }]}>
            <Select
              placeholder="Select department"
              options={departments.map((d) => ({ value: d, label: d }))}
            />
          </Form.Item>

          <Form.Item label="Job Role" name="jobRole" rules={[{ required: true }]}>
            <Select
              placeholder="Select role"
              options={roles.map((r) => ({ value: r, label: r }))}
            />
          </Form.Item>

          <Form.Item label="Gender" name="gender" rules={[{ required: true }]}>
            <Input placeholder="e.g., Male, Female" />
          </Form.Item>

          <Form.Item label="Age" name="age" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={18} max={100} />
          </Form.Item>

          <Form.Item label="Marital Status" name="maritalStatus" rules={[{ required: true }]}>
            <Select options={MARITAL_STATUS_OPTIONS} />
          </Form.Item>

          <Form.Item label="Attrition" name="attrition" rules={[{ required: true }]}>
            <Select options={ATTRITION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Business Travel" name="businessTravel" rules={[{ required: true }]}>
            <Select options={BUSINESS_TRAVEL_OPTIONS} />
          </Form.Item>

          <Form.Item label="Education" name="education" rules={[{ required: true }]}>
            <Select options={EDUCATION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Education Field" name="educationField" rules={[{ required: true }]}>
            <Select options={EDUCATION_FIELD_OPTIONS} />
          </Form.Item>

          <Form.Item label="Over Time" name="overTime" rules={[{ required: true }]}>
            <Select options={ATTRITION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Monthly Income" name="monthlyIncome" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={100} />
          </Form.Item>

          <Form.Item label="Percent Salary Hike" name="percentSalaryHike" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>

          <Form.Item label="Job Level (1-5)" name="jobLevel" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={5} />
          </Form.Item>

          <Form.Item label="Distance From Home (km)" name="distanceFromHome" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Number of Companies Worked"
            name="numCompaniesWorked"
            rules={[{ required: true }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Total Working Years" name="totalWorkingYears" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Years at Company" name="yearsAtCompany" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Years in Current Role" name="yearsInCurrentRole" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Years Since Last Promotion"
            name="yearsSinceLastPromotion"
            rules={[{ required: true }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Years with Current Manager" name="yearsWithCurrManager" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Training Times Last Year" name="trainingTimesLastYear" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Training Hours Last Year" name="trainingHoursLastYear" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Training Hours Last 6 Months"
            name="trainingHoursLast6Months"
            rules={[{ required: true }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Training Gap Score" name="trainingGapScore" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>

          <Form.Item
            label="Environment Satisfaction"
            name="environmentSatisfaction"
            rules={[{ required: true }]}
          >
            <Select options={SATISFACTION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Job Involvement" name="jobInvolvement" rules={[{ required: true }]}>
            <Select options={SATISFACTION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Job Satisfaction" name="jobSatisfaction" rules={[{ required: true }]}>
            <Select options={SATISFACTION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Performance Rating" name="performanceRating" rules={[{ required: true }]}>
            <Select options={PERFORMANCE_RATING_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Relationship Satisfaction"
            name="relationshipSatisfaction"
            rules={[{ required: true }]}
          >
            <Select options={SATISFACTION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Work Life Balance" name="workLifeBalance" rules={[{ required: true }]}>
            <Select options={SATISFACTION_OPTIONS} />
          </Form.Item>

          <Form.Item label="Absence Days Last Month" name="absenceDaysLastMonth" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Absence Days Last 3 Months" name="absenceDaysLast3Months" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Absence Ratio" name="absenceRatio" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={1} step={0.01} />
          </Form.Item>

          <Form.Item label="Late Arrivals Last Month" name="lateArrivalsLastMonth" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Overtime Hours Last Month" name="overtimeHoursLastMonth" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={0.1} />
          </Form.Item>

          <Form.Item label="Workload Pressure Index" name="workloadPressureIndex" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>

          <Form.Item label="Engagement Score" name="engagementScore" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>

          <Form.Item label="Manager Feedback Score" name="managerFeedbackScore" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>

          <Form.Item label="Role Stability Ratio" name="roleStabilityRatio" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} max={1} step={0.01} />
          </Form.Item>

          <Form.Item label="Attrition Risk Class" name="attritionRiskClass" rules={[{ required: true }]}>
            <Select options={ATTRITION_RISK_OPTIONS} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
