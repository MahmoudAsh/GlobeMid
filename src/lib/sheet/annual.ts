/**
 * The "Annual" column is the manager's count of ANNUAL days deducted for that row —
 * the source of truth for annual leave balance. Values seen: "1 Day", "2 Day", "3  Day",
 * "1 Day ( عيد ميلاد )", "1 Sick", "5 Day Sick", "2 SiCK", "Sick", "OFF", "EID".
 */
export interface AnnualCell {
  /** Leading number when the cell looks like "N day" and is not about sick leave. */
  annualDays: number
  /** The cell is about sick leave ("1 Sick", "5 Day Sick", "Sick"). */
  isSick: boolean
  /** Number of sick days written in the cell, if any. */
  sickDays: number | null
}

export function parseAnnualCell(cell: string | null | undefined): AnnualCell {
  const s = (cell ?? '').replace(/ /g, ' ')
  if (/sick/i.test(s)) {
    const n = /^\s*(\d+(?:\.\d+)?)/.exec(s)
    return { annualDays: 0, isSick: true, sickDays: n ? Number(n[1]) : null }
  }
  const m = /^\s*(\d+(?:\.\d+)?)\s*day/i.exec(s)
  return { annualDays: m ? Number(m[1]) : 0, isSick: false, sickDays: null }
}
