/** POST /users — create login account linked to an employee (SUPER_ADMIN). */
export type CreateEmployeeUserAccountDto = {
  name: string
  email: string
  phone?: string
  password: string
  role: 'EMPLOYEE'
  employee_id: number
}

export type EmployeePickerItem = {
  id: number
  name: string
  name_code: string
}
