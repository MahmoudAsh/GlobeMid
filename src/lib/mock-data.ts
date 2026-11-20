/**
 * Realistic mock data used until the Google Sheet is connected.
 * Deterministic (seeded) so numbers are stable between reloads.
 */
import { addDays, format } from 'date-fns'
import { fromKey, isWorkingDay, toKey, workingDaysBetween } from './dates'
import { employeeId } from './ids'
import type { Employee, LeaveRequest, LeaveStatus, LeaveType } from './types'


const DEPARTMENTS: Record<string, string[]> = {
  'Medical Affairs': [
    'Dr. Ahmed Hassan', 'Dr. Mona Abdelrahman', 'Dr. Karim El-Sayed', 'Dr. Nourhan Fathy',
    'Dr. Tarek Mansour', 'Dr. Heba Soliman', 'Dr. Mahmoud Ashraf', 'Dr. Yasmin Gamal',
    'Dr. Omar Farouk', 'Dr. Rania Mostafa', 'Dr. Sherif Nabil', 'Dr. Dina Hamdy',
    'Dr. Amr Zaki', 'Dr. Salma Ibrahim',
  ],
  'Sales & Marketing': [
    'Mohamed Adel', 'Aya Khaled', 'Mostafa Samir', 'Nada El-Shenawy', 'Islam Ragab',
    'Menna Tawfik', 'Hossam Eldin Youssef', 'Sara Magdy', 'Ahmed Fawzy', 'Reem Abdelaziz',
    'Khaled Lotfy', 'Marwa Sobhy', 'Youssef Wael', 'Habiba Saeed', 'Ali Abdelhamid',
    'Esraa Mahmoud',
  ],
  'Operations & Supply Chain': [
    'Hany Shawky', 'Ehab Morsy', 'Nermeen Fouad', 'Waleed Kamal', 'Hassan Abdallah',
    'Shaimaa Rashad', 'Mina Girgis', 'Bassem Helmy', 'Doaa Salah', 'Ibrahim El-Masry',
    'Mariam Boutros', 'Sameh Anwar', 'Ola Hegazy',
  ],
  'Finance & HR': [
    'Ghada Zaher', 'Ayman Badawy', 'Noha Ezzat', 'Fady Naguib', 'Laila Osman',
    'Ramy Shehata', 'Hend El-Gendy', 'Tamer Barakat', 'Inas Sabry', 'Wael Darwish',
    'Christine Habib', 'Moataz Khalil',
  ],
}

export const mockEmployees: Employee[] = Object.entries(DEPARTMENTS).flatMap(([department, names]) =>
  names.map((name) => ({ id: employeeId(name), name, department })),
)

/** These people have never requested leave (they still appear in the Employees table). */
const NO_REQUESTS = new Set([
  'Dr. Amr Zaki', 'Ali Abdelhamid', 'Esraa Mahmoud', 'Ola Hegazy', 'Moataz Khalil', 'Mina Girgis',
])

const REASONS: Record<LeaveType, string[]> = {
  Annual: [
    'Family vacation', 'Trip to Sahel', 'Travelling to Hurghada', 'Visiting family in Alexandria',
    'Eid holiday extension', 'Personal time off', 'Brother’s wedding', 'Moving to a new apartment',
    'Kids’ school break', 'Umrah', 'Rest after conference season', 'Summer holiday',
  ],
  Sick: [
    'Flu', 'Fever', 'Food poisoning', 'Back pain', 'Dental procedure', 'Migraine',
    'Doctor’s appointment', 'Minor surgery recovery', 'Gastroenteritis', 'Eye infection',
  ],
  Casual: [
    'Personal errand', 'Family emergency', 'Car broke down', 'Government paperwork',
    'Child is sick', 'Home maintenance', 'Bank appointment', 'Visa appointment at embassy',
  ],
  Unpaid: [
    'Extended travel', 'Caring for a family member', 'Personal matters', 'Postgraduate exams',
  ],
  Other: ['Marriage leave', 'Bereavement', 'Hajj', 'Exam leave'],
}

// --- deterministic PRNG (mulberry32) ---
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261120)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
function weighted<T extends string>(w: Record<T, number>): T {
  const entries = Object.entries(w) as [T, number][]
  let r = rand() * entries.reduce((s, [, v]) => s + v, 0)
  for (const [k, v] of entries) if ((r -= v) < 0) return k
  return entries[0][0]
}

/** End date after `days` working days starting at `start` (a working day). */
function endAfterWorkingDays(start: Date, days: number) {
  let d = start
  let count = 1
  while (count < days) {
    d = addDays(d, 1)
    if (isWorkingDay(d)) count++
  }
  return d
}

const TODAY = toKey(new Date())
const RANGE_START = fromKey(`${new Date().getFullYear() - 1}-01-01`)
const RANGE_END = fromKey(`${new Date().getFullYear()}-12-31`)
const SPAN_DAYS = Math.round((RANGE_END.getTime() - RANGE_START.getTime()) / 86400000)

function durationFor(type: LeaveType) {
  switch (type) {
    case 'Annual':
      return rand() < 0.1 ? int(8, 10) : int(1, 5)
    case 'Sick':
      return pick([1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 5])
    case 'Casual':
      return rand() < 0.85 ? 1 : 2
    case 'Unpaid':
      return int(2, 5)
    case 'Other':
      return int(3, 5)
  }
}

function statusFor(start: string): LeaveStatus {
  if (start > TODAY) return weighted({ pending: 80, approved: 15, rejected: 5 })
  const daysAgo = (fromKey(TODAY).getTime() - fromKey(start).getTime()) / 86400000
  if (daysAgo < 14) return weighted({ approved: 60, pending: 30, rejected: 10 })
  return weighted({ approved: 78, rejected: 17, pending: 5 })
}

function buildRequests(): LeaveRequest[] {
  const busy = new Map<string, [string, string][]>()
  const free = (name: string, s: string, e: string) =>
    !(busy.get(name) ?? []).some(([bs, be]) => s <= be && e >= bs)
  const out: LeaveRequest[] = []

  const add = (emp: Employee, type: LeaveType, start: Date, days: number, status?: LeaveStatus) => {
    const s = toKey(start)
    const e = toKey(endAfterWorkingDays(start, days))
    if (!free(emp.name, s, e)) return false
    busy.set(emp.name, [...(busy.get(emp.name) ?? []), [s, e]])
    const st = status ?? statusFor(s)
    // Sick leave is usually logged on/after the first day; everything else ahead of time.
    let submitted = type === 'Sick' ? addDays(start, int(0, 2)) : addDays(start, -int(2, 25))
    if (toKey(submitted) > TODAY) submitted = fromKey(TODAY)
    out.push({
      id: '',
      employee: emp.name,
      employeeId: emp.id,
      department: emp.department,
      type,
      startDate: s,
      endDate: e,
      days: workingDaysBetween(s, e),
      reason: pick(REASONS[type]),
      status: st,
      submittedAt: toKey(submitted),
    })
    return true
  }

  const byName = (n: string) => mockEmployees.find((e) => e.name === n)!
  const now = fromKey(TODAY)
  // A few guaranteed entries around "today" so the "on leave today / this week" widgets have data.
  const thisWeekSunday = addDays(now, -now.getDay())
  add(byName('Dr. Heba Soliman'), 'Annual', addDays(thisWeekSunday, 3), 4, 'approved')
  add(byName('Mostafa Samir'), 'Sick', addDays(thisWeekSunday, 4), 2, 'approved')
  add(byName('Hany Shawky'), 'Annual', addDays(thisWeekSunday, 0), 5, 'approved')
  add(byName('Noha Ezzat'), 'Casual', addDays(thisWeekSunday, 2), 1, 'approved')
  add(byName('Aya Khaled'), 'Annual', addDays(thisWeekSunday, 1), 3, 'pending')
  add(byName('Waleed Kamal'), 'Unpaid', addDays(thisWeekSunday, 4), 3, 'approved')

  const active = mockEmployees.filter((e) => !NO_REQUESTS.has(e.name))
  let guard = 0
  while (out.length < 204 && guard++ < 5000) {
    const emp = pick(active)
    const type = weighted<LeaveType>({ Annual: 40, Sick: 24, Casual: 26, Unpaid: 7, Other: 3 })
    let start = addDays(RANGE_START, int(0, SPAN_DAYS))
    while (!isWorkingDay(start)) start = addDays(start, 1)
    if (toKey(start) > toKey(RANGE_END)) continue
    add(emp, type, start, durationFor(type))
  }

  out.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.employee.localeCompare(b.employee))
  out.forEach((r, i) => (r.id = `REQ-${format(fromKey(r.startDate), 'yy')}${String(i + 1).padStart(4, '0')}`))
  return out
}

export const mockRequests: LeaveRequest[] = buildRequests()
