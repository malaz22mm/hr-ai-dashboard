import type { PaginationMetaDto } from '@/types/dto'

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export function clampTake(take: number | undefined, max = MAX_PAGE_SIZE): number {
  if (take === undefined || Number.isNaN(take)) return DEFAULT_PAGE_SIZE
  return Math.min(Math.max(1, Math.floor(take)), max)
}

export function clampSkip(skip: number | undefined): number {
  if (skip === undefined || Number.isNaN(skip)) return 0
  return Math.max(0, Math.floor(skip))
}

export function computeTotalPages(meta: PaginationMetaDto): number {
  if (typeof meta.pages === 'number' && meta.pages >= 0) return meta.pages
  const take = meta.take > 0 ? meta.take : DEFAULT_PAGE_SIZE
  return Math.max(1, Math.ceil(meta.total / take))
}

export function normalizePaginationMeta(meta: unknown): PaginationMetaDto | null {
  if (meta === null || typeof meta !== 'object') return null
  const m = meta as Record<string, unknown>
  const total = typeof m.total === 'number' ? m.total : Number(m.total)
  const skip = typeof m.skip === 'number' ? m.skip : Number(m.skip)
  const take = typeof m.take === 'number' ? m.take : Number(m.take)
  const pages = typeof m.pages === 'number' ? m.pages : Number(m.pages)
  if (!Number.isFinite(total) || !Number.isFinite(skip) || !Number.isFinite(take)) return null
  return {
    total,
    skip,
    take,
    pages: Number.isFinite(pages) ? pages : undefined,
  }
}
