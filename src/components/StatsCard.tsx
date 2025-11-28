import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatsCardProps = {
  title: string;
  value: string;
  trendLabel?: string;
  trend?: 'up' | 'down';
  icon?: ReactNode;
  description?: string;
}

export function StatsCard({ title, value, icon, trend, trendLabel, description }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {icon ? <div className="rounded-full bg-slate-900/5 p-3 text-slate-900">{icon}</div> : null}
      </div>
      {trendLabel ? (
        <p
          className={cn(
            'mt-4 inline-flex items-center text-sm font-semibold',
            trend === 'down' ? 'text-red-500' : 'text-emerald-600',
          )}
        >
          <span className="mr-1 text-base">{trend === 'down' ? '▼' : '▲'}</span>
          {trendLabel}
        </p>
      ) : null}
    </div>
  )
}


