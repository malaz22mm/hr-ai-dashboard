import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal, Space, message } from 'antd'
import type { FilterValue, SorterResult, TablePaginationConfig } from 'antd/es/table/interface'
import { DeleteOutlined, PlusOutlined, ClearOutlined } from '@ant-design/icons'
import { EmployeeTable } from '@/components/EmployeeTable'
import { AddEditEmployeeModal } from '@/components/AddEditEmployeeModal'
import {
  createEmployee,
  deleteEmployee,
  deleteEmployeesBulk,
  fetchEmployees,
  updateEmployee,
} from '@/lib/api'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { CreateEmployeeDto, Employee, EmployeesQueryParams, UpdateEmployeeDto } from '@/lib/types'

type TableFiltersState = Record<string, FilterValue | null>

// Map table filter keys to backend query parameter keys
const FILTER_KEY_MAP: Record<string, keyof EmployeesQueryParams> = {
  department: 'department',
  jobRole: 'jobRole',
  gender: 'gender',
  attrition: 'attrition',
  maritalStatus: 'maritalStatus',
  businessTravel: 'businessTravel',
  education: 'education',
  educationField: 'educationField',
  overTime: 'overTime',
  attritionRiskClass: 'attritionRiskClass',
  environmentSatisfaction: 'environmentSatisfaction',
  jobInvolvement: 'jobInvolvement',
  jobSatisfaction: 'jobSatisfaction',
  performanceRating: 'performanceRating',
  relationshipSatisfaction: 'relationshipSatisfaction',
  workLifeBalance: 'workLifeBalance',
}

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [tableFilters, setTableFilters] = useState<TableFiltersState>({})
  const [sorter, setSorter] = useState<{ field?: string; order?: 'ascend' | 'descend' }>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Convert Ant Design table filters to backend query parameters
  const buildQueryParams = useCallback(
    (
      page: number,
      pageSize: number,
      filters: TableFiltersState,
      sort: { field?: string; order?: 'ascend' | 'descend' },
    ): EmployeesQueryParams => {
      const params: EmployeesQueryParams = {
        skip: (page - 1) * pageSize,
        take: pageSize,
      }

      // Map sorting
      if (sort.field && sort.order) {
        params.sortBy = sort.field
        params.sortOrder = sort.order === 'ascend' ? 'asc' : 'desc'
      }

      // Map filters - support multiple filters simultaneously
      Object.entries(filters).forEach(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return

        const mappedKey = FILTER_KEY_MAP[key]
        if (mappedKey) {
          // Single value or first value for enum fields
          if (Array.isArray(value)) {
            if (value.length === 1) {
              ;(params as any)[mappedKey] = String(value[0])
            } else {
              // Multiple selections - use first one (backend supports single value)
              ;(params as any)[mappedKey] = String(value[0])
            }
          } else {
            ;(params as any)[mappedKey] = String(value)
          }
        }

        // Handle range filters
        if (key === 'age') {
          if (Array.isArray(value) && value.length === 2) {
            params.minAge = Number(value[0])
            params.maxAge = Number(value[1])
          }
        }
        if (key === 'monthlyIncome') {
          if (Array.isArray(value) && value.length === 2) {
            params.minMonthlyIncome = Number(value[0])
            params.maxMonthlyIncome = Number(value[1])
          }
        }
        if (key === 'jobLevel') {
          if (Array.isArray(value) && value.length === 2) {
            params.minJobLevel = Number(value[0])
            params.maxJobLevel = Number(value[1])
          }
        }
        if (key === 'engagementScore') {
          if (Array.isArray(value) && value.length === 2) {
            params.minEngagementScore = Number(value[0])
            params.maxEngagementScore = Number(value[1])
          }
        }
        if (key === 'yearsAtCompany') {
          if (Array.isArray(value) && value.length === 2) {
            params.minYearsAtCompany = Number(value[0])
            params.maxYearsAtCompany = Number(value[1])
          }
        }
      })

      return params
    },
    [],
  )

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = buildQueryParams(pagination.page, pagination.pageSize, tableFilters, sorter)
      const response = await fetchEmployees(queryParams)
      setEmployees(response.data)
      setPagination((prev) => ({
        ...prev,
        total: response.meta.total,
      }))
    } catch (error: unknown) {
      console.error(error)
      message.error(getApiErrorMessage(error, 'Failed to load employees'))
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams, pagination.page, pagination.pageSize, sorter, tableFilters])

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
      const field = sorterResult.field as string | undefined
      const order = sorterResult.order ?? undefined
      setSorter(field ? { field, order } : {})
    }
  }

  const handleModalSubmit = async (payload: CreateEmployeeDto) => {
    try {
      if (editingEmployee) {
        const updatePayload: UpdateEmployeeDto = {
          ...editingEmployee,
          ...payload,
        }
        await updateEmployee(updatePayload)
        message.success('Employee updated successfully')
      } else {
        await createEmployee(payload)
        message.success('Employee created successfully')
      }
      setIsModalOpen(false)
      setEditingEmployee(null)
      await loadEmployees()
    } catch (error: unknown) {
      console.error(error)
      message.error(getApiErrorMessage(error, 'Unable to save employee'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id)
      message.success('Employee deleted successfully')
      setSelectedRowKeys((keys) => keys.filter((key) => key !== id))
      await loadEmployees()
    } catch (error: unknown) {
      console.error(error)
      message.error(getApiErrorMessage(error, 'Unable to delete employee'))
    }
  }

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete selected employees',
      content: `This will delete ${selectedRowKeys.length} employee(s). This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteEmployeesBulk(selectedRowKeys)
          message.success(`${selectedRowKeys.length} employee(s) deleted successfully`)
          setSelectedRowKeys([])
          await loadEmployees()
        } catch (error: unknown) {
          console.error(error)
          message.error(getApiErrorMessage(error, 'Unable to delete selected employees'))
        }
      },
    })
  }

  const handleClearFilters = () => {
    setTableFilters({})
    setSorter({})
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const activeFilterCount = useMemo(() => {
    return Object.values(tableFilters).filter((f) => f && f.length > 0).length
  }, [tableFilters])

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          'Research & Development',
          'Sales',
          'Human Resources',
          ...employees.map((e) => e.department),
        ]),
      ).filter(Boolean),
    [employees],
  )

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set([
          'Sales Executive',
          'Research Scientist',
          'Laboratory Technician',
          'Manufacturing Director',
          'Healthcare Representative',
          'Manager',
          'Sales Representative',
          'Research Director',
          'Human Resources',
          ...employees.map((e) => e.jobRole),
        ]),
      ).filter(Boolean),
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
              Delete selected ({selectedRowKeys.length})
            </Button>
            {activeFilterCount > 0 && (
              <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                Clear filters ({activeFilterCount})
              </Button>
            )}
          </Space>
          {selectedRowKeys.length > 0 && (
            <span className="text-sm font-medium text-slate-500">
              {selectedRowKeys.length} selected
            </span>
          )}
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
