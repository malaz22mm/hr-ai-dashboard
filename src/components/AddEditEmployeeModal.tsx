import { useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import dayjs from 'dayjs'
import type { Employee, EmployeePayload } from '@/lib/types'

type EmployeeFormValues = Omit<EmployeePayload, 'hireDate'> & { hireDate: dayjs.Dayjs }

type AddEditEmployeeModalProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (payload: EmployeePayload) => Promise<void> | void;
  employee?: Employee | null;
  departments: string[];
  roles: string[];
}

export function AddEditEmployeeModal({
  open,
  onCancel,
  onSubmit,
  employee,
  departments,
  roles,
}: AddEditEmployeeModalProps) {
  const [form] = Form.useForm<EmployeeFormValues>()

  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        ...employee,
        hireDate: dayjs(employee.hireDate),
      })
    } else {
      form.resetFields()
    }
  }, [employee, form])

  const handleFinish = async (values: EmployeeFormValues) => {
    await onSubmit({
      ...values,
      hireDate: values.hireDate.toISOString(),
    })
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
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          performanceScore: 80,
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          label="First name"
          name="firstName"
          rules={[{ required: true, message: 'First name is required' }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>
        <Form.Item
          label="Last name"
          name="lastName"
          rules={[{ required: true, message: 'Last name is required' }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email address' },
          ]}
        >
          <Input placeholder="name@company.com" />
        </Form.Item>
        <Form.Item label="Department" name="department" rules={[{ required: true, message: 'Select a department' }]}>
          <Select
            placeholder="Select department"
            options={departments.map((department) => ({ value: department, label: department }))}
          />
        </Form.Item>
        <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Select a role' }]}>
          <Select placeholder="Select role" options={roles.map((role) => ({ value: role, label: role }))} />
        </Form.Item>
        <Form.Item label="Hire date" name="hireDate" rules={[{ required: true, message: 'Select hire date' }]}>
          <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={(date) => date.isAfter(dayjs())} />
        </Form.Item>
        <Form.Item
          label="Performance score"
          name="performanceScore"
          rules={[{ required: true, message: 'Provide a score' }]}
        >
          <InputNumber className="w-full" min={0} max={100} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

