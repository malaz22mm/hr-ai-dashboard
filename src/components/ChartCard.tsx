import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { PerformancePoint } from '@/lib/types'

type ChartCardProps = {
  title: string;
  subtitle?: string;
  data: PerformancePoint[];
}

export function ChartCard({ data, title, subtitle }: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis domain={[70, 100]} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ borderRadius: 16, borderColor: '#cbd5f5' }}
              cursor={{ stroke: '#0f172a', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#0f172a"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, stroke: '#0f172a', fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


