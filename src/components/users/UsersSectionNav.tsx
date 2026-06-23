import { Link, useLocation } from 'react-router-dom'
import { Button, Space } from 'antd'
import { UserAddOutlined, UnorderedListOutlined } from '@ant-design/icons'

const USERS_LIST_PATH = '/users'
const CREATE_EMPLOYEE_ACCOUNT_PATH = '/users/create-employee-account'

export function UsersSectionNav() {
  const { pathname } = useLocation()
  const onList = pathname === USERS_LIST_PATH
  const onCreateEmployeeAccount = pathname === CREATE_EMPLOYEE_ACCOUNT_PATH

  return (
    <Space wrap>
      <Link to={USERS_LIST_PATH}>
        <Button type={onList ? 'primary' : 'default'} icon={<UnorderedListOutlined />}>
          قائمة المستخدمين
        </Button>
      </Link>
      <Link to={CREATE_EMPLOYEE_ACCOUNT_PATH}>
        <Button
          type={onCreateEmployeeAccount ? 'primary' : 'default'}
          icon={<UserAddOutlined />}
        >
          إنشاء حساب موظف
        </Button>
      </Link>
    </Space>
  )
}
