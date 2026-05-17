import { useMemo, useRef } from 'react'
import { Table, Input, Button, Space, Popconfirm, Tag } from 'antd'
import type { InputRef } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterDropdownProps, FilterValue, SorterResult } from 'antd/es/table/interface'
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { Employee } from '@/lib/types'

type EmployeeTableProps = {
  data: Employee[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  filters: Record<string, FilterValue | null>;
  selectedRowKeys: string[];
  onChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
  ) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onSelectChange: (selectedIds: string[]) => void;
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
      Array.from(new Set(data.map((employee) => employee.jobRole))).map((role) => ({
        text: role,
        value: role,
      })),
    [data],
  )

  const genderFilters = useMemo(
    () =>
      Array.from(new Set(data.map((employee) => employee.gender))).map((gender) => ({
        text: gender,
        value: gender,
      })),
    [data],
  )

  const attritionRiskFilters = useMemo(
    () =>
      ['Low', 'Medium', 'High'].map((risk) => ({
        text: risk,
        value: risk,
      })),
    [],
  )

  const performanceRatingFilters = useMemo(
    () =>
      ['Low', 'Good', 'Excellent', 'Outstanding'].map((rating) => ({
        text: rating,
        value: rating,
      })),
    [],
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
      width: 200,
      ...getTextColumnProps('id', 'ID'),
      render: (value: string) => value.substring(0, 8) + '...',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      filters: departmentFilters,
      filteredValue: filters.department ?? null,
      width: 180,
    },
    {
      title: 'Job Role',
      dataIndex: 'jobRole',
      filters: roleFilters,
      filteredValue: filters.jobRole ?? null,
      width: 200,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      filters: genderFilters,
      filteredValue: filters.gender ?? null,
      width: 100,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      sorter: true,
      width: 80,
    },
    {
      title: 'Monthly Income',
      dataIndex: 'monthlyIncome',
      sorter: true,
      width: 140,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Engagement Score',
      dataIndex: 'engagementScore',
      sorter: true,
      width: 150,
      render: (value: number) => (
        <Tag color={value >= 85 ? 'success' : value >= 70 ? 'warning' : 'error'}>{value}</Tag>
      ),
    },
    {
      title: 'Performance Rating',
      dataIndex: 'performanceRating',
      filters: performanceRatingFilters,
      filteredValue: filters.performanceRating ?? null,
      width: 160,
      render: (value: string) => (
        <Tag
          color={
            value === 'Outstanding'
              ? 'success'
              : value === 'Excellent'
                ? 'cyan'
                : value === 'Good'
                  ? 'blue'
                  : 'default'
          }
        >
          {value}
        </Tag>
      ),
    },
    {
      title: 'Attrition Risk',
      dataIndex: 'attritionRiskClass',
      filters: attritionRiskFilters,
      filteredValue: filters.attritionRiskClass ?? null,
      width: 130,
      render: (value: string) => (
        <Tag
          color={
            value === 'High' ? 'error' : value === 'Medium' ? 'warning' : 'success'
          }
        >
          {value}
        </Tag>
      ),
    },
    {
      title: 'Years at Company',
      dataIndex: 'yearsAtCompany',
      sorter: true,
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Link
            to={`/employees/${record.id}`}
            state={{ employee: record }}
            className="text-slate-700"
          >
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
        showTotal: (value, range) =>
          `${range[0]}-${range[1]} of ${value} employees`,
      }}
      scroll={{ x: 'max-content' }}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectChange(keys as string[]),
      }}
      onChange={onChange}
    />
  )
}
