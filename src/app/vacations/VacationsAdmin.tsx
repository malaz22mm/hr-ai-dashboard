import { useState } from 'react'
import { Alert, Button, Select, Space, Table, message, Popconfirm } from 'antd'
import {
  useProcessVacationMutation,
  useVacationsListQuery,
} from '@/features/vacations'
import { useAuthStore } from '@/auth/authStore'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { VacationStatusFilter } from '@/types/dto'

const STATUS_OPTIONS: { value: VacationStatusFilter | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Approved' },
  { value: 2, label: 'Rejected' },
]

function statusLabel(status: number) {
  if (status === 1) return 'Approved'
  if (status === 2) return 'Rejected'
  return 'Pending'
}

export default function VacationsAdmin() {
  const userId = useAuthStore((s) => s.userId)
  const [statusFilter, setStatusFilter] = useState<VacationStatusFilter | 'all'>('all')
  const status = statusFilter === 'all' ? undefined : statusFilter
  const { data, isLoading, error, refetch } = useVacationsListQuery(status)
  const processMutation = useProcessVacationMutation()

  const handleProcess = async (id: number, statusId: 1 | 2) => {
    if (!userId) {
      message.error('Admin user id missing from session')
      return
    }
    try {
      await processMutation.mutateAsync({
        id,
        payload: { adminId: userId, statusId },
      })
      message.success(statusId === 1 ? 'Request approved' : 'Request rejected')
      await refetch()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Could not process request'))
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Time off</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Vacation Requests</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Admin list and approval via <code className="text-xs">GET /vacations</code> and{' '}
          <code className="text-xs">PATCH /vacations/:id/process</code>.
        </p>
      </header>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Could not load vacation requests"
          description={getApiErrorMessage(error, 'Request failed')}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Space className="mb-4" wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 160 }}
          />
        </Space>

        <Table
          rowKey="id"
          loading={isLoading || processMutation.isPending}
          dataSource={data ?? []}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 72 },
            { title: 'Employee', dataIndex: 'emp_id' },
            { title: 'Start', dataIndex: 'start_date' },
            { title: 'End', dataIndex: 'end_date' },
            { title: 'Reason', dataIndex: 'reason', ellipsis: true },
            {
              title: 'Status',
              dataIndex: 'approval_status',
              render: (v: number) => statusLabel(v),
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, row) =>
                row.approval_status === 0 ? (
                  <Space>
                    <Popconfirm title="Approve this request?" onConfirm={() => handleProcess(row.id, 1)}>
                      <Button type="primary" size="small">
                        Approve
                      </Button>
                    </Popconfirm>
                    <Popconfirm title="Reject this request?" onConfirm={() => handleProcess(row.id, 2)}>
                      <Button danger size="small">
                        Reject
                      </Button>
                    </Popconfirm>
                  </Space>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
