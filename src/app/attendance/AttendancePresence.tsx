import { Table, Alert, Spin, Tag } from 'antd'
import { useAttendancePresenceQuery } from '@/features/attendance'
import { getApiErrorMessage } from '@/lib/apiErrors'

export default function AttendancePresence() {
  const { data, isLoading, error } = useAttendancePresenceQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Attendance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Currently Checked In</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Live presence from <code className="text-xs">GET /attendance/presence</code>.
        </p>
      </header>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Could not load presence"
          description={getApiErrorMessage(error, 'Request failed')}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Table
          rowKey={(row, index) => String(row.emp_id ?? index)}
          loading={isLoading}
          dataSource={data ?? []}
          pagination={false}
          columns={[
            {
              title: 'Employee ID',
              dataIndex: 'emp_id',
              render: (v: number) => v ?? '—',
            },
            {
              title: 'Name',
              key: 'name',
              render: (_, row) => {
                const emp = row.employee as { name?: string } | undefined
                return emp?.name ?? '—'
              },
            },
            {
              title: 'Check-in',
              dataIndex: 'check_in',
              render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
            },
            {
              title: 'Status',
              key: 'status',
              render: () => <Tag color="green">On site</Tag>,
            },
          ]}
        />
        {!isLoading && !error && (data?.length ?? 0) === 0 ? (
          <p className="mt-4 text-center text-sm text-slate-500">No active check-ins.</p>
        ) : null}
      </div>
    </div>
  )
}
