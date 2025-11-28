import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal, Space, message } from 'antd'
import type { FilterValue, SorterResult, TablePaginationConfig } from 'antd/es/table/interface'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { EmployeeTable } from '@/components/EmployeeTable'
import { AddEditEmployeeModal } from '@/components/AddEditEmployeeModal'
import {
  createEmployee,
  deleteEmployee,
  deleteEmployeesBulk,
  fetchEmployees,
  updateEmployee,
} from '@/lib/api'
import type { Employee, EmployeePayload, EmployeeSort } from '@/lib/types'

const DEFAULT_DEPARTMENTS = ['People Operations', 'Sales', 'Analytics', 'Talent Acquisition', 'Product']
const DEFAULT_ROLES = ['HR Director', 'People Partner', 'People Analyst', 'Recruiter', 'HRBP']

type TableFiltersState = Record<string, FilterValue | null>

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [tableFilters, setTableFilters] = useState<TableFiltersState>({})
  const [sorter, setSorter] = useState<EmployeeSort>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const normalizeFilters = useCallback((filters: TableFiltersState) => {
    const normalized: Partial<Record<'fullName' | keyof Employee, string | string[]>> = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value.length === 0) return
      normalized[key as 'fullName' | keyof Employee] =
        value.length === 1 ? String(value[0]) : value.map((entry) => String(entry))
    })
    return normalized
  }, [])

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetchEmployees({
        page: pagination.page,
        pageSize: pagination.pageSize,
        filters: normalizeFilters(tableFilters),
        sort: sorter.field ? sorter : undefined,
      })
      setEmployees(response.data)
      setPagination((prev) => ({
        ...prev,
        total: response.total,
      }))
    } catch (error) {
      console.error(error)
      message.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [normalizeFilters, pagination.page, pagination.pageSize, sorter, tableFilters])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorterResult: SorterResult<Employee> | SorterResult<Employee>[],
  ) => {
    setPagination((prev) => ({
      ...prev,
      page: paginationConfig.current ?? 1,
      pageSize: paginationConfig.pageSize ?? prev.pageSize,
    }))
    setTableFilters(filters)

    if (!Array.isArray(sorterResult)) {
      const field = sorterResult.field as keyof Employee | undefined
      const order = sorterResult.order ?? undefined
      setSorter(field ? { field, order } : {})
    }
  }

  const handleModalSubmit = async (payload: EmployeePayload) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload)
        message.success('Employee updated')
      } else {
        await createEmployee(payload)
        message.success('Employee created')
      }
      setIsModalOpen(false)
      setEditingEmployee(null)
      await loadEmployees()
    } catch (error) {
      console.error(error)
      message.error('Unable to save employee')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee(id)
      message.success('Employee deleted')
      setSelectedRowKeys((keys) => keys.filter((key) => key !== id))
      await loadEmployees()
    } catch (error) {
      console.error(error)
      message.error('Unable to delete employee')
    }
  }

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete selected employees',
      content: `This will delete ${selectedRowKeys.length} employee(s).`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteEmployeesBulk(selectedRowKeys)
          message.success('Employees deleted')
          setSelectedRowKeys([])
          await loadEmployees()
        } catch (error) {
          console.error(error)
          message.error('Unable to delete selected employees')
        }
      },
    })
  }

  const departmentOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_DEPARTMENTS, ...employees.map((employee) => employee.department)])).filter(Boolean),
    [employees],
  )
  const roleOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_ROLES, ...employees.map((employee) => employee.role)])).filter(Boolean),
    [employees],
  )

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">People</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Employee Directory</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Search, filter, and drill into performance signals across every employee.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEmployee(null)
                setIsModalOpen(true)
              }}
            >
              Add New
            </Button>
            <Button
              danger
              ghost
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkDelete}
            >
              Delete selected
            </Button>
          </Space>
          {selectedRowKeys.length > 0 ? (
            <span className="text-sm font-medium text-slate-500">
              {selectedRowKeys.length} selected
            </span>
          ) : null}
        </div>

        <EmployeeTable
          data={employees}
          loading={loading}
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.pageSize}
          filters={tableFilters}
          selectedRowKeys={selectedRowKeys}
          onChange={handleTableChange}
          onEdit={(employee) => {
            setEditingEmployee(employee)
            setIsModalOpen(true)
          }}
          onDelete={handleDelete}
          onSelectChange={setSelectedRowKeys}
        />
      </div>

      <AddEditEmployeeModal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingEmployee(null)
        }}
        employee={editingEmployee}
        departments={departmentOptions}
        roles={roleOptions}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}

