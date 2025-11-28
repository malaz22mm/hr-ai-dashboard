import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchEmployeeById } from '@/lib/api'
import type { Employee } from '@/lib/types'

export default function EmployeeDetails() {
  const { employeeId } = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    if (!employeeId) return
    fetchEmployeeById(employeeId).then((result) => setEmployee(result ?? null))
  }, [employeeId])

  if (!employeeId) {
    return <p className="text-muted-foreground">No employee selected.</p>
  }

  if (!employee) {
    return <p className="text-muted-foreground">Loading employee record...</p>
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{employee.name}</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {employee.role} · {employee.department}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{employee.status}</p>
          <p className="mt-1 text-sm text-muted-foreground">Employee ID: {employee.id}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Performance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{employee.performance}%</p>
          <p className="mt-1 text-sm text-muted-foreground">{employee.alerts} alerts currently open</p>
        </div>
      </div>
    </div>
  )
}


