import { useMemo, useRef } from 'react'
import { Table, Input, Button, Space, Popconfirm, Tag } from 'antd'
import type { InputRef } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterDropdownProps, FilterValue, SorterResult } from 'antd/es/table/interface'
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Employee } from '@/lib/types'

type EmployeeTableProps = {
  data: Employee[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  filters: Record<string, FilterValue | null>;
  selectedRowKeys: number[];
  onChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
  ) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  onSelectChange: (selectedIds: number[]) => void;
}

export function EmployeeTable({
  data,
  loading,
  total,
  page,
  pageSize,
  filters,
  selectedRowKeys,
  onChange,
  onEdit,
  onDelete,
  onSelectChange,
}: EmployeeTableProps) {
  const searchInput = useRef<InputRef>(null)

  const departmentFilters = useMemo(
    () =>
      Array.from(new Set(data.map((employee) => employee.department))).map((department) => ({
        text: department,
        value: department,
      })),
    [data],
  )

  const roleFilters = useMemo(
    () =>
      Array.from(new Set(data.map((employee) => employee.role))).map((role) => ({
        text: role,
        value: role,
      })),
    [data],
  )

  const handleSearch = (confirm: FilterDropdownProps['confirm']) => {
    confirm({ closeDropdown: true })
  }

  const handleReset = (clearFilters?: () => void, confirm?: FilterDropdownProps['confirm']) => {
    clearFilters?.()
    confirm?.({ closeDropdown: true })
  }

  const getTextColumnProps = (filterKey: string, label = filterKey): ColumnsType<Employee>[number] => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(event) => event.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${label}`}
          value={selectedKeys[0]}
          onChange={(event) => setSelectedKeys(event.target.value ? [event.target.value] : [])}
          onPressEnter={() => handleSearch(confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(confirm)}
            icon={<SearchOutlined />}
            size="small"
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters, confirm)} size="small">
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    filteredValue: filters[filterKey] ?? null,
  })

  const columns: ColumnsType<Employee> = [
    {
      title: 'ID',
      dataIndex: 'id',
      sorter: true,
      width: 100,
      ...getTextColumnProps('id', 'ID'),
      render: (value: number) => `EMP-${value.toString().padStart(3, '0')}`,
    },
    {
      title: 'Full Name',
      dataIndex: 'firstName',
      width: 220,
      key: 'fullName',
      ...getTextColumnProps('fullName', 'full name'),
      render: (_value, record) => (
        <div>
          <div className="font-medium text-slate-900">
            {record.firstName} {record.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 220,
      ...getTextColumnProps('email'),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      filters: departmentFilters,
      filteredValue: filters.department ?? null,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      filters: roleFilters,
      filteredValue: filters.role ?? null,
    },
    {
      title: 'Hire Date',
      dataIndex: 'hireDate',
      sorter: true,
      width: 140,
      render: (value: string) => dayjs(value).format('MMM D, YYYY'),
    },
    {
      title: 'Performance',
      dataIndex: 'performanceScore',
      sorter: true,
      width: 140,
      render: (value: number) => <Tag color={value >= 85 ? 'success' : value >= 70 ? 'warning' : 'error'}>{value}%</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Link to={`/employees/${record.id}`} className="text-slate-700">
            <EyeOutlined />
          </Link>
          <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete employee"
            description="Are you sure you want to delete this employee?"
            okText="Delete"
            okType="danger"
            onConfirm={() => onDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table<Employee>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (value) => `${value} employees`,
      }}
      scroll={{ x: 'max-content' }}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectChange(keys as number[]),
      }}
      onChange={onChange}
    />
  )
}


