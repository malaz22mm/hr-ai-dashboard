import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from '@/app/dashboard/Dashboard'
import EmployeesList from '@/app/employees/EmployeesList'
import EmployeeDetails from '@/app/employees/EmployeeDetails'
import Reports from '@/app/reports/Reports'
import Settings from '@/app/settings/Settings'
import Login from '@/app/auth/Login'
import { MainLayout } from '@/layout/MainLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<EmployeesList />} />
          <Route path="employees/:employeeId" element={<EmployeeDetails />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
