import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Modal, Form, Select, Space, Table, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { createUser, deleteUser, fetchUsers } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { CreateUserDto, User, UserRole } from '@/lib/types'

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<CreateUserDto>()

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchUsers(search.trim() || undefined)
      setUsers(data)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [loadUsers])

  const handleCreate = async (values: CreateUserDto) => {
    try {
      await createUser(values)
      message.success('User created')
      setModalOpen(false)
      form.resetFields()
      await loadUsers()
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not create user'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      message.success('User deleted')
      await loadUsers()
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not delete user'))
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Manage workspace accounts. Requires SUPER_ADMIN on the API.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Space wrap className="mb-4">
          <Input.Search
            placeholder="Search by name, email, phone, or ID"
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add user
          </Button>
        </Space>

        <Table<User>
          rowKey="id"
          loading={loading}
          dataSource={users}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Phone', dataIndex: 'phone', render: (v) => v ?? '—' },
            { title: 'Role', dataIndex: 'role', render: (v) => v ?? '—' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Popconfirm
                  title="Delete this user?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="Create user"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="ADMIN">
            <Select
              options={[
                { value: 'ADMIN' as UserRole, label: 'Admin' },
                { value: 'SUPER_ADMIN' as UserRole, label: 'Super Admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
