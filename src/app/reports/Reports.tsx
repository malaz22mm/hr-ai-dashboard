import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { ChartCard } from '@/components/ChartCard'
import { fetchEmployeeStats, mapStatsToPerformancePoints } from '@/lib/api'
import type { EmployeeStatsGroupBy, PerformancePoint } from '@/lib/types'

const REPORT_CHARTS: { groupBy: EmployeeStatsGroupBy; title: string; subtitle: string }[] = [
  {
    groupBy: 'department',
    title: 'Job satisfaction by department',
    subtitle: 'Avg. satisfaction (scaled) from GET /employees/stats',
  },
  {
    groupBy: 'jobRole',
    title: 'Job satisfaction by role',
    subtitle: 'Grouped by job role',
  },
  {
    groupBy: 'attritionRiskClass',
    title: 'Satisfaction by attrition risk',
    subtitle: 'Low / Medium / High risk segments',
  },
]

export default function Reports() {
  const [charts, setCharts] = useState<Record<EmployeeStatsGroupBy, PerformancePoint[]>>({
    department: [],
    jobRole: [],
    education: [],
    attritionRiskClass: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          REPORT_CHARTS.map(async ({ groupBy }) => {
            const rows = await fetchEmployeeStats(groupBy)
            return [groupBy, mapStatsToPerformancePoints(rows, groupBy)] as const
          }),
        )
        if (!mounted) return
        setCharts((prev) => ({
          ...prev,
          ...Object.fromEntries(results),
        }))
      } catch (error) {
        console.error('Failed to load reports:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reports</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Insights & Analytics</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Aggregated employee metrics from the live API.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {REPORT_CHARTS.map(({ groupBy, title, subtitle }) => (
          <ChartCard
            key={groupBy}
            data={charts[groupBy]}
            title={title}
            subtitle={subtitle}
            yDomain={[0, 100]}
          />
        ))}
      </div>
    </div>
  )
}
