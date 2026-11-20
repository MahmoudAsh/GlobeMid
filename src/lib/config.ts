/** Settings that describe the sheet. Change them here (or via env vars where noted). */
export const SHEET_CONFIG = {
  /**
   * Year of the FIRST week in the sheet. The sheet never writes years ("27-12 to 2-1");
   * later years are inferred from the Dec → Jan rollover. Override with VITE_SHEET_BASE_YEAR.
   */
  baseYear: Number(import.meta.env?.VITE_SHEET_BASE_YEAR) || 2025,
  /**
   * The FSRs tab's manually-kept "Annual Used" counter only counts from this week on
   * (verified: counting from here, 48 of 54 people match exactly; counting the whole sheet, 28).
   * The Employees table compares it with the annual days computed from the same week.
   */
  fsrCounterStart: (import.meta.env?.VITE_FSR_COUNTER_START as string | undefined) || '2026-03-28',
}
