import type { EmployeeStatsGroupDto } from '@/types/dto'

/** Normalize GET /employees/stats rows — supports Swagger shape and legacy Prisma-style aggregates. */
export function normalizeEmployeeStatsRows(raw: unknown): EmployeeStatsGroupDto[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((row): EmployeeStatsGroupDto | null => {
      if (row === null || typeof row !== 'object') return null
      const r = row as Record<string, unknown>

      if (typeof r.group === 'number' && typeof r.count === 'number') {
        return {
          group: r.group,
          count: r.count,
          averageSalary: num(r.averageSalary),
          averageAge: num(r.averageAge),
          averageTenure: num(r.averageTenure),
          avgEngagement: num(r.avgEngagement),
          avgWorkload: num(r.avgWorkload),
        }
      }

      const count =
        typeof (r._count as Record<string, unknown> | undefined)?.id === 'number'
          ? ((r._count as Record<string, unknown>).id as number)
          : typeof r.count === 'number'
            ? r.count
            : 0

      const groupId =
        pickGroupId(r) ??
        (typeof r.group === 'number' ? r.group : null)

      if (groupId === null) return null

      const avg = (r._avg as Record<string, unknown> | undefined) ?? {}

      return {
        group: groupId,
        count,
        averageSalary: num(avg.monthly_income ?? r.averageSalary),
        averageAge: num(avg.age ?? r.averageAge),
        averageTenure: num(avg.years_at_company ?? r.averageTenure),
        avgEngagement: num(avg.job_satisfaction_id ?? avg.engagement_score ?? r.avgEngagement),
        avgWorkload: num(avg.workload_pressure_index ?? r.avgWorkload),
      }
    })
    .filter((row): row is EmployeeStatsGroupDto => row !== null)
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function pickGroupId(r: Record<string, unknown>): number | null {
  const keys = [
    'department_id',
    'job_role_id',
    'education_id',
    'marital_status_id',
    'business_travel_id',
    'work_shift_id',
    'attrition_risk_class_id',
    'performance_rating_id',
  ] as const
  for (const key of keys) {
    const v = r[key]
    if (typeof v === 'number') return v
  }
  return null
}
