import { Alert, Button, Card, Form, Input, Table, message, Spin } from 'antd'
import {
  useAttendanceHistoryQuery,
  useAttendancePunchMutation,
} from '@/features/attendance'
import { useCreateVacationMutation, useEmployeeVacationsQuery } from '@/features/vacations'
import { getApiErrorMessage } from '@/lib/apiErrors'

type Props = {
  empId: number
  employeeName?: string
}

function vacationStatusLabel(status: number) {
  if (status === 1) return 'Approved'
  if (status === 2) return 'Rejected'
  return 'Pending'
}

export function EmployeeAttendanceVacationPanel({ empId, employeeName }: Props) {
  const [form] = Form.useForm<{ startDate: string; endDate: string; reason: string }>()
  const punchMutation = useAttendancePunchMutation()
  const createVacation = useCreateVacationMutation()
  const { data: history, isLoading: historyLoading, error: historyError } = useAttendanceHistoryQuery(empId)
  const { data: vacations, isLoading: vacationsLoading, error: vacationsError } =
    useEmployeeVacationsQuery(empId)

  const handlePunch = async () => {
    try {
      await punchMutation.mutateAsync({ empId })
      message.success('Attendance punch recorded')
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Punch failed'))
    }
  }

  const handleVacationSubmit = async (values: { startDate: string; endDate: string; reason: string }) => {
    try {
      await createVacation.mutateAsync({
        empId,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
      })
      message.success('Vacation request submitted')
      form.resetFields()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Could not submit vacation request'))
    }
  }

  return (
    <>
      <Card
        title="Live Attendance"
        extra={
          <Button type="primary" loading={punchMutation.isPending} onClick={handlePunch}>
            Punch in / out
          </Button>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Smart punch via <code className="text-xs">POST /attendance/punch</code>
          {employeeName ? ` for ${employeeName}` : ''}.
        </p>
        {historyError ? (
          <Alert
            type="error"
            showIcon
            className="mb-3"
            message="Could not load attendance history"
            description={getApiErrorMessage(historyError, 'Request failed')}
          />
        ) : null}
        {historyLoading ? (
          <Spin />
        ) : (
          <Table
            size="small"
            rowKey="id"
            pagination={{ pageSize: 5 }}
            dataSource={history ?? []}
            columns={[
              {
                title: 'Check-in',
                dataIndex: 'check_in',
                render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
              },
              {
                title: 'Check-out',
                dataIndex: 'check_out',
                render: (v: string | null) => (v ? new Date(v).toLocaleString() : 'Open'),
              },
            ]}
          />
        )}
      </Card>

      <Card title="Vacation Requests" className="mt-4">
        {vacationsError ? (
          <Alert
            type="error"
            showIcon
            className="mb-3"
            message="Could not load vacation requests"
            description={getApiErrorMessage(vacationsError, 'Request failed')}
          />
        ) : null}
        {vacationsLoading ? (
          <Spin />
        ) : (
          <Table
            size="small"
            rowKey="id"
            className="mb-4"
            pagination={false}
            dataSource={vacations ?? []}
            columns={[
              { title: 'Start', dataIndex: 'start_date' },
              { title: 'End', dataIndex: 'end_date' },
              { title: 'Reason', dataIndex: 'reason', ellipsis: true },
              {
                title: 'Status',
                dataIndex: 'approval_status',
                render: (v: number) => vacationStatusLabel(v),
              },
            ]}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleVacationSubmit}>
          <Form.Item name="startDate" label="Start date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="End date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="default" htmlType="submit" loading={createVacation.isPending}>
            Submit vacation request
          </Button>
        </Form>
      </Card>
    </>
  )
}
