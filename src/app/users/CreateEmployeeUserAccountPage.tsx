import { useMemo } from 'react'
import { Alert, Button, Form, Input, Select, Spin, message } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { UsersSectionNav } from '@/components/users/UsersSectionNav'
import { isApiError } from '@/api/errors'
import {
  useCreateEmployeeUserAccountMutation,
  useEmployeesPickerQuery,
} from '@/features/employee-user-account'
import { getApiErrorMessage } from '@/lib/apiErrors'

type FormValues = {
  employee_id: number
  name: string
  email: string
  phone?: string
  password: string
}

const SUCCESS_MESSAGE =
  'تم إنشاء الحساب بنجاح. سيحتاج الموظف لتفعيل الحساب عبر البريد الإلكتروني'

export default function CreateEmployeeUserAccountPage() {
  const [form] = Form.useForm<FormValues>()
  const { data: employees, isLoading: employeesLoading, error: employeesError } =
    useEmployeesPickerQuery()
  const createMutation = useCreateEmployeeUserAccountMutation()

  const employeeOptions = useMemo(
    () =>
      (employees ?? []).map((emp) => ({
        value: emp.id,
        label: `${emp.name} (#${emp.id})`,
        name: emp.name,
      })),
    [employees],
  )

  const handleEmployeeChange = (employee_id: number) => {
    const selected = employeeOptions.find((o) => o.value === employee_id)
    if (selected) {
      form.setFieldsValue({ name: selected.name })
    }
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        password: values.password,
        role: 'EMPLOYEE',
        employee_id: values.employee_id,
      })
      message.success(SUCCESS_MESSAGE)
      form.resetFields()
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 409) {
          message.error('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل')
          return
        }
        if (error.status === 403) {
          message.error('ليس لديك صلاحية لإنشاء حسابات')
          return
        }
      }
      message.error(getApiErrorMessage(error, 'فشل إنشاء الحساب'))
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">الإدارة</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">إنشاء حساب موظف</h1>
        <p className="mt-1 text-base text-muted-foreground">
          ربط موظف موجود بحساب دخول (دور EMPLOYEE). يتطلب صلاحية SUPER_ADMIN.
        </p>
        <div className="mt-4">
          <UsersSectionNav />
        </div>
      </header>

      {employeesError ? (
        <Alert
          type="error"
          showIcon
          message="تعذر تحميل قائمة الموظفين"
          description={getApiErrorMessage(employeesError, 'تحقق من الاتصال بالخادم')}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {employeesLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark="optional"
            className="max-w-lg"
          >
            <Form.Item
              name="employee_id"
              label="الموظف"
              rules={[{ required: true, message: 'يرجى اختيار موظف' }]}
            >
              <Select
                showSearch
                placeholder="ابحث واختر موظفاً"
                optionFilterProp="label"
                options={employeeOptions}
                onChange={handleEmployeeChange}
                loading={employeesLoading}
                notFoundContent={employeesLoading ? <Spin size="small" /> : 'لا يوجد موظفون'}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="الاسم"
              rules={[{ required: true, message: 'الاسم مطلوب' }]}
            >
              <Input placeholder="اسم الحساب" />
            </Form.Item>

            <Form.Item
              name="email"
              label="البريد الإلكتروني"
              rules={[
                { required: true, message: 'البريد الإلكتروني مطلوب' },
                { type: 'email', message: 'يرجى إدخال بريد إلكتروني صالح' },
              ]}
            >
              <Input type="email" placeholder="user@example.com" dir="ltr" className="text-left" />
            </Form.Item>

            <Form.Item name="phone" label="رقم الهاتف (اختياري)">
              <Input placeholder="+963 9xx xxx xxx" dir="ltr" className="text-left" />
            </Form.Item>

            <Form.Item
              name="password"
              label="كلمة المرور"
              rules={[
                { required: true, message: 'كلمة المرور مطلوبة' },
                { min: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
              ]}
            >
              <Input.Password placeholder="••••••••" dir="ltr" className="text-left" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                icon={<UserAddOutlined />}
                loading={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                إنشاء الحساب
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  )
}
