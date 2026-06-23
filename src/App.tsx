import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from '@/app/dashboard/Dashboard'
import EmployeesList from '@/app/employees/EmployeesList'
import EmployeeDetails from '@/app/employees/EmployeeDetails'
import Reports from '@/app/reports/Reports'
import Settings from '@/app/settings/Settings'
import Login from '@/app/auth/Login'
import VerifyEmail from '@/app/auth/VerifyEmail'
import ForgotPassword from '@/app/auth/ForgotPassword'
import AttendancePresence from '@/app/attendance/AttendancePresence'
import VacationsAdmin from '@/app/vacations/VacationsAdmin'
import UsersList from '@/app/users/UsersList'
import CreateEmployeeUserAccountPage from '@/app/users/CreateEmployeeUserAccountPage'
import { MainLayout } from '@/layout/MainLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequireRole } from '@/routes/RequireRole'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="employees/:employeeId" element={<EmployeeDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="attendance" element={<AttendancePresence />} />
        <Route path="vacations" element={<VacationsAdmin />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="users/create-employee-account"
          element={
            <RequireRole allow={['SUPER_ADMIN']} fallbackPath="/">
              <CreateEmployeeUserAccountPage />
            </RequireRole>
          }
        />
        <Route
          path="users"
          element={
            <RequireRole allow={['SUPER_ADMIN']} fallbackPath="/">
              <UsersList />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
