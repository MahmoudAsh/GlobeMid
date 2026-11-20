/**
 * ============================================================================
 *  DATA SOURCE — the only place that knows where the data comes from.
 * ============================================================================
 *
 *  • Default: the CSV bundled in src/data/weekly-requests.csv (an export of the
 *    "Weekly Requests" tab).
 *  • Live:    set VITE_SHEET_CSV_URL to the sheet's CSV export, e.g.
 *      https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Weekly%20Requests
 *    (the sheet must be shared "Anyone with the link can view"). The live CSV has no Row /
 *    RowColor columns — the parser then uses row positions and the Status text only.
 *
 *  The FSR list (src/data/fsrs.csv) and name fixes (src/data/name-aliases.json) are always
 *  bundled. Everything goes through the same parser: src/lib/sheet/parse.ts.
 */
import aliases from '@/data/name-aliases.json'
import fsrCsv from '@/data/fsrs.csv?raw'
import bundledCsv from '@/data/weekly-requests.csv?raw'
import { SHEET_CONFIG } from './config'
import { parseWeeklyRequests } from './sheet/parse'
import type { LeaveData } from './types'

const SHEET_CSV_URL = import.meta.env?.VITE_SHEET_CSV_URL as string | undefined

export async function loadLeaveData(): Promise<LeaveData> {
  let csv = bundledCsv
  if (SHEET_CSV_URL) {
    const res = await fetch(SHEET_CSV_URL)
    if (!res.ok) throw new Error(`Couldn’t read the Google Sheet (${res.status} ${res.statusText})`)
    csv = await res.text()
  }
  return parseWeeklyRequests(csv, fsrCsv, { baseYear: SHEET_CONFIG.baseYear, aliases })
}
