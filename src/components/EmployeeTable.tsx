import type { Employee } from '@/lib/types'
import { cn } from '@/lib/utils'

type EmployeeTableProps = {
  employees: Employee[];
  title?: string;
  subtitle?: string;
}

export function EmployeeTable({ employees, title = 'People snapshot', subtitle }: EmployeeTableProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <button className="text-sm font-medium text-slate-600 hover:text-slate-900">View all</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Performance</th>
              <th className="px-5 py-3 text-right">Alerts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {employees.map((employee) => (
              <tr key={employee.id} className="transition hover:bg-slate-50/60">
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">{employee.name}</div>
                  <p className="text-xs text-muted-foreground">{employee.id}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{employee.role}</td>
                <td className="px-5 py-4 text-slate-600">{employee.department}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                      employee.status === 'Active' && 'bg-emerald-50 text-emerald-700',
                      employee.status === 'On Leave' && 'bg-amber-50 text-amber-600',
                      employee.status === 'Terminated' && 'bg-rose-50 text-rose-600',
                    )}
                  >
                    {employee.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${employee.performance}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{employee.performance}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-900">{employee.alerts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


