import { useEffect, useState } from 'react'
import { AlertTriangle, Gauge, Users } from 'lucide-react'
import { StatsCard } from '@/components/StatsCard'
import { ChartCard } from '@/components/ChartCard'
import {
  fetchAlerts,
  fetchDashboardSnapshot,
  fetchEmployees,
  fetchPerformanceSeries,
} from '@/lib/api'
import type { Alert, Employee, PerformancePoint } from '@/lib/types'

export default function Dashboard() {
  const [topEmployees, setTopEmployees] = useState<Employee[]>([])
  const [performanceSeries, setPerformanceSeries] = useState<PerformancePoint[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [snapshot, setSnapshot] = useState({
    employees: 0,
    performance: 0,
    alerts: 0,
    performanceTrend: 0,
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const [employeePage, performance, alertFeed, stats] = await Promise.all([
        fetchEmployees({ pageSize: 5, sort: { field: 'performanceScore', order: 'descend' } }),
        fetchPerformanceSeries(),
        fetchAlerts(),
        fetchDashboardSnapshot(),
      ])

      if (!mounted) return
      setTopEmployees(employeePage.data)
      setPerformanceSeries(performance)
      setAlerts(alertFeed)
      setSnapshot(stats)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">HR Performance Snapshot</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Stay on top of headcount, wellbeing, and escalations in real time.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Total employees"
          value={snapshot.employees.toString()}
          description="Including full-time, contractors, and interns."
          trend="up"
          trendLabel="+12 hires past 30 days"
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Performance average"
          value={`${snapshot.performance}%`}
          description="Blended performance index vs. last month."
          trend="up"
          trendLabel={`${snapshot.performanceTrend}% improvement`}
          icon={<Gauge className="h-6 w-6" />}
        />
        <StatsCard
          title="Open alerts"
          value={snapshot.alerts.toString()}
          description="Policy, payroll, and compliance signals."
          trend={snapshot.alerts > 4 ? 'down' : 'up'}
          trendLabel={snapshot.alerts > 4 ? 'Investigations in progress' : 'Risk trending low'}
          icon={<AlertTriangle className="h-6 w-6" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard data={performanceSeries} title="Engagement performance" subtitle="Rolling 12 months" />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Alerts Center</p>
              <p className="text-sm text-muted-foreground">Signals requiring HR attention</p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {alerts.length} active
            </span>
          </div>
          <ul className="mt-4 space-y-4">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-900">{alert.message}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{alert.severity}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Top performers</p>
            <p className="text-sm text-muted-foreground">Highest engagement scores this quarter</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated daily</span>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {topEmployees.map((employee) => (
            <li key={employee.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee.role} · {employee.department}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{employee.performanceScore}%</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}


