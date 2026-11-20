/**
 * Employee names in the sheet are free text: extra / leading spaces, non-breaking spaces,
 * different case, typos and short names. We normalize, then apply `src/data/name-aliases.json`
 * (the single place to fix names), then match against the FSR list.
 */

/** Replace non-breaking spaces, collapse whitespace, trim. Case is kept (for display). */
export function normalizeName(raw: string | null | undefined): string {
  return (raw ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

/** Comparison key: normalized + lowercase. */
export const nameKey = (raw: string | null | undefined) => normalizeName(raw).toLowerCase()

/** URL-safe id from a canonical name. */
export function employeeId(name: string) {
  return nameKey(name)
    .normalize('NFKD')
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface ResolvedName {
  /** Canonical display name (FSR spelling when the person is in the list). */
  canonical: string
  key: string
  inFsrList: boolean
  /** True when name-aliases.json was used. */
  aliased: boolean
}

/**
 * Build a resolver: raw name → canonical person.
 * Alias keys and targets are compared case-insensitively; a target that matches an FSR name
 * takes the FSR spelling.
 */
export function createNameResolver(aliases: Record<string, string>, fsrNames: string[]) {
  const fsr = new Map(fsrNames.map((n) => [nameKey(n), normalizeName(n)]))
  const alias = new Map(Object.entries(aliases).map(([from, to]) => [nameKey(from), normalizeName(to)]))
  return (raw: string): ResolvedName => {
    const name = normalizeName(raw)
    const target = alias.get(nameKey(name))
    const chosen = target ?? name
    const key = nameKey(chosen)
    const fsrSpelling = fsr.get(key)
    return { canonical: fsrSpelling ?? chosen, key, inFsrList: !!fsrSpelling, aliased: !!target }
  }
}
