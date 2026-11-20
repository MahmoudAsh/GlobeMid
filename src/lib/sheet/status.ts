import type { Category, RowStatus } from '../types'

export interface MappedStatus {
  status: RowStatus
  /** Some statuses also decide the category ("Sick", "Training"). */
  forcedCategory: Category | null
}

/**
 * Status column → status.
 *  Approved → approved · Rejected (or a red row, RowColor FF0000) → rejected
 *  Sick → approved + category Sick · Training → approved + category Training
 *  empty → not_marked (NOT pending: e.g. the Eid-week allocations are never marked)
 */
export function mapStatus(status: string | null | undefined, rowColor?: string | null): MappedStatus {
  const s = (status ?? '').trim().toLowerCase()
  const red = /^(ff)?ff0000$/i.test((rowColor ?? '').trim().replace(/^#/, ''))
  if (s.startsWith('reject') || red) return { status: 'rejected', forcedCategory: s === 'sick' ? 'sick' : null }
  if (s === 'sick') return { status: 'approved', forcedCategory: 'sick' }
  if (s === 'training') return { status: 'approved', forcedCategory: 'training' }
  if (s.startsWith('approv')) return { status: 'approved', forcedCategory: null }
  if (!s) return { status: 'not_marked', forcedCategory: null }
  // Unknown non-empty value: treat as approved (it's a recorded decision) — shows up in the data check counts.
  return { status: 'approved', forcedCategory: null }
}
