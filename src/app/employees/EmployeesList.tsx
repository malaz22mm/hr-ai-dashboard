import { useEffect, useState } from 'react'
import { EmployeeTable } from '@/components/EmployeeTable'
import { fetchEmployees } from '@/lib/api'
import type { Employee } from '@/lib/types'

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetchEmployees().then(setEmployees)
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">People</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Employee Directory</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Search, filter, and drill into performance signals across every employee.
        </p>
      </header>

      <EmployeeTable employees={employees} subtitle="Updated moments ago" title="Employees" />
    </div>
  )
}


