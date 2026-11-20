/**
 * Request-text classifier. The "Request" column is free text in English / Arabic / mixed, with
 * typos, and one row can mention several things ("1 اجازه رسمي + انيوال"). We return EVERY
 * matching category, plus a primary one for charts and sorting.
 *
 * ── To add a keyword: add a pattern to KEYWORDS below. Patterns are case-insensitive. ──
 */
import type { Category } from '../types'

interface Rule {
  category: Category
  patterns: RegExp[]
  /**
   * Matched text is removed before later rules run, so e.g. "cancel day off" doesn't also
   * count as "day off", and "عيد ميلاد" (birthday) doesn't count as Eid.
   */
  consume?: boolean
}

/** Order matters only for rules with `consume`. */
export const KEYWORDS: Rule[] = [
  {
    category: 'cancelledOff',
    consume: true,
    patterns: [/cancel+(?:ed)?\s*(?:the\s*)?day\s*off/i, /day\s*off\s*is\s*cancel+ed/i, /off\s*cancel+ed/i, /يوم\s*بديل/, /double\s*paid/i],
  },
  { category: 'birthday', consume: true, patterns: [/birth\s*day/i, /brith\s*day/i, /bith\s*day/i, /عيد\s*ميلاد/] },
  { category: 'outOfSchedule', consume: true, patterns: [/out\s*of\s*sch(?:edule)?/i, /بر[هة]\s*الجدول/, /اووت/] },
  { category: 'leaving', patterns: [/last\s*working\s*day/i, /[اآ]خر\s*يوم\s*شغل/] },
  { category: 'noShow', patterns: [/no\s*show/i] },
  { category: 'annual', patterns: [/annual/i, /anuual/i, /\banual\b/i, /annaul/i, /انيوال/, /انيول/, /سنوي/] },
  { category: 'sick', patterns: [/sick/i, /تعبان/, /مرض/] },
  {
    category: 'publicHoliday',
    patterns: [/public\s*holiday/i, /official\s*leave/i, /اجاز[هة]\s*رسمي/, /رسمي[هة]?/, /شم\s*(?:ال)?نسيم/, /\beid\b/i, /عيد/],
  },
  { category: 'training', patterns: [/training/i, /out\s*side/i, /ouside/i, /meeting/i, /تدريب/] },
  { category: 'emergency', patterns: [/emergen/i, /emergan/i, /طوار(?:ئ|ى|ىء)/] },
  { category: 'bereavement', patterns: [/وفا[هةة]/, /bereavement/i] },
  { category: 'wedding', patterns: [/wedding/i] },
  { category: 'shift', patterns: [/shift/i, /long\s*day/i, /\blong\b/i] },
  { category: 'dayOff', patterns: [/\boff\b/i, /day\s*off/i, /weekly\s*off/i, /راح[هة]/] },
]

/** Priority for the primary category (first match wins). */
export const PRIORITY: Category[] = [
  'sick',
  'training',
  'annual',
  'publicHoliday',
  'birthday',
  'emergency',
  'bereavement',
  'wedding',
  'leaving',
  'noShow',
  'cancelledOff',
  'outOfSchedule',
  'dayOff',
  'shift',
  'other',
]

export interface ClassifyInput {
  text: string
  /** Annual column > 0 → also Annual. */
  annualDays?: number
  /** Annual column says "Sick". */
  annualCellIsSick?: boolean
  /** From the Status column ("Sick" / "Training"). */
  forcedCategory?: Category | null
}

export interface Classification {
  categories: Category[]
  primary: Category
  /** True when no keyword matched (→ 'other'); listed on the Data check page. */
  unclassified: boolean
}

export function classifyRequest({ text, annualDays = 0, annualCellIsSick, forcedCategory }: ClassifyInput): Classification {
  let working = (text ?? '').replace(/ /g, ' ')
  const found = new Set<Category>()
  for (const rule of KEYWORDS) {
    for (const re of rule.patterns) {
      if (!re.test(working)) continue
      found.add(rule.category)
      if (rule.consume) working = working.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), ' ')
    }
  }
  if (annualDays > 0) found.add('annual')
  if (annualCellIsSick) found.add('sick')
  if (forcedCategory) found.add(forcedCategory)

  const unclassified = found.size === 0
  if (unclassified) found.add('other')
  const categories = PRIORITY.filter((c) => found.has(c))
  const primary = forcedCategory ?? categories[0]
  return { categories, primary, unclassified }
}

/**
 * Approximate day count written in a request: the leading number ("5 Sick" → 5,
 * "2 Day + OFF" → 2), else the first "N day(s)/يوم/ايام" anywhere, else 1.
 */
export function approxDays(text: string | null | undefined): number {
  const s = (text ?? '').replace(/ /g, ' ')
  const lead = /^\s*(\d+(?:\.\d+)?)/.exec(s)
  if (lead) return Number(lead[1])
  const withUnit = /(\d+(?:\.\d+)?)\s*(?:days?|يوم|ايام|أيام)/i.exec(s)
  return withUnit ? Number(withUnit[1]) : 1
}
