/**
 * Normalized model of the "Weekly Requests" sheet.
 * One LeaveRow = one line the manager wrote for ONE employee in ONE week (there are no exact dates).
 */

export type RowStatus = 'approved' | 'rejected' | 'not_marked'

export type Category =
  | 'annual'
  | 'sick'
  | 'publicHoliday'
  | 'birthday'
  | 'dayOff'
  | 'cancelledOff'
  | 'shift'
  | 'training'
  | 'emergency'
  | 'bereavement'
  | 'wedding'
  | 'outOfSchedule'
  | 'noShow'
  | 'leaving'
  | 'other'

export interface LeaveRow {
  /**
   * Unique id. Sheet rows: the original sheet row number.
   * App rows (added from the dashboard): APP_ID_OFFSET + database id.
   */
  id: number
  /** Where the row comes from: the Google Sheet export, or the "Add leave request" form (Cloudflare D1). */
  source: 'sheet' | 'app'
  /** App rows only: database id (for deleting) and the exact dates the manager picked. */
  appId?: number
  exactStart?: Date
  exactEnd?: Date
  /** Name exactly as typed (whitespace-normalized). */
  rawName: string
  /** Canonical name after aliases / FSR spelling. */
  employee: string
  employeeId: string
  inFsrList: boolean
  weekStart: Date
  weekEnd: Date
  /** `yyyy-MM-dd` of weekStart — used for all period filtering. */
  weekKey: string
  /** The sheet's own label, e.g. "27-12 to 2-1". */
  weekLabel: string
  requestText: string
  categories: Category[]
  primaryCategory: Category
  status: RowStatus
  /** Annual days deducted (Annual column). 0 for rejected rows. The source of truth for annual balance. */
  annualDays: number
  /** Approximate days for the non-annual categories (sick, holiday, …). 0 for rejected rows. */
  otherDays: number
  /** The raw "Annual" cell, for display. */
  annualCell: string
  note: string
}

export interface Employee {
  id: string
  name: string
  inFsrList: boolean
  /** The sheet's manually-kept "Annual Used" counter (FSRs tab). null when not in the list or not a number. */
  fsrAnnualUsed: number | null
  /** Raw spellings merged into this person, with row counts. */
  variants: { raw: string; count: number }[]
}

export interface DataIssues {
  /** Rows with a name but a Week that couldn't be read. */
  unparsedWeeks: { row: number; name: string; week: string }[]
  /** Parsed week starts that aren't Saturdays (sheet weeks run Sat → Fri). */
  nonSaturdayWeeks: { row: number; weekLabel: string; start: string }[]
  /** Rows skipped because the Name cell is empty (e.g. placeholder weeks). */
  emptyNameRows: { row: number; week: string }[]
  /** Names that are neither in the FSR list nor in name-aliases.json. */
  unmatchedNames: { name: string; count: number; rows: number[] }[]
  /** Request texts the classifier couldn't put in any category. */
  unclassified: { text: string; count: number; rows: number[] }[]
}

export interface LeaveData {
  rows: LeaveRow[]
  employees: Employee[]
  issues: DataIssues
  /** Every distinct sheet week (weekStart keys), ascending — week mode steps through these. */
  sheetWeeks: string[]
  /** Raw status counts as written in the sheet (for verifying with the manager). */
  rawStatusCounts: Record<string, number>
  /** Total data lines in the file (incl. skipped ones). */
  rawRowCount: number
  /** Requests added from the dashboard (Cloudflare D1). */
  app: { available: boolean; count: number }
}
