import { useEffect, useState } from 'react'
import { ChartCard } from '@/components/ChartCard'
import { fetchPerformanceSeries } from '@/lib/api'
import type { PerformancePoint } from '@/lib/types'

export default function Reports() {
  const [data, setData] = useState<PerformancePoint[]>([])

  useEffect(() => {
    fetchPerformanceSeries().then(setData)
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reports</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Insights & Analytics</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Export-ready dashboards covering performance, headcount, and compliance.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard data={data} title="Engagement trend" subtitle="Interactive line report" />
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Automations</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule recurring exports and push insights to your BI stack.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              Weekly attrition forecast delivered to leadership inbox.
            </li>
            <li className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              Monthly pay equity compliance package with variance highlights.
            </li>
            <li className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              On-demand performance health report with AI commentary.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}


