/**
 * Demo data in exactly the same shape as the real Google Sheet, so it goes through the
 * same parsing (`sheetToLeaveData`) as the real thing. Deterministic (seeded).
 * Contains NO real people — names are invented.
 */
import { addDays, format, startOfWeek } from 'date-fns'
import { WEEK_STARTS_ON } from './constants'
import type { SheetTabs } from './data-source'

const ROSTER = [
  'Ahmed Hassan', 'Mona Abdelrahman', 'Karim El Sayed', 'Nourhan Fathy', 'Tarek Mansour', 'Heba Soliman',
  'Omar Farouk', 'Rania Mostafa', 'Sherif Nabil', 'Dina Hamdy', 'Amr Zaki', 'Salma Ibrahim',
  'Mohamed Adel', 'Aya Khaled', 'Mostafa Samir', 'Nada El Shenawy', 'Islam Ragab', 'Menna Tawfik',
  'Hossam Youssef', 'Sara Magdy', 'Ahmed Fawzy', 'Reem Abdelaziz', 'Khaled Lotfy', 'Marwa Sobhy',
  'Youssef Wael', 'Habiba Saeed', 'Ali Abdelhamid', 'Esraa Mahmoud', 'Hany Shawky', 'Ehab Morsy',
  'Nermeen Fouad', 'Waleed Kamal', 'Hassan Abdallah', 'Shaimaa Rashad', 'Mina Girgis', 'Bassem Helmy',
  'Doaa Salah', 'Ibrahim El Masry', 'Mariam Boutros', 'Sameh Anwar', 'Ola Hegazy', 'Ghada Zaher',
  'Ayman Badawy', 'Noha Ezzat', 'Fady Naguib', 'Laila Osman', 'Ramy Shehata', 'Hend El Gendy',
  'Tamer Barakat', 'Inas Sabry', 'Wael Darwish', 'Christine Habib', 'Moataz Khalil', 'Yara Nasser',
  'Adham Fekry', 'Rehab Saad', 'Ziad Hosny',
]
/** People who never send requests (they still show in the Employees table). */
const QUIET = new Set(['Amr Zaki', 'Ali Abdelhamid', 'Ola Hegazy', 'Moataz Khalil', 'Mina Girgis'])
/** People who send requests but aren't in the roster (shown with a "not in roster" tag). */
const EXTRA = ['Sameer Fahmy', 'Nesma Ali']
/** Spelling variants typed in the requests, fixed by the Aliases tab. */
const VARIANTS: Record<string, string> = { 'Mostafa Samir': 'Moustafa Samir', 'Heba Soliman': 'Heba Sliman' }

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

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

/** Templates: [request text, Annual column, default status ('' = use the usual mix)]. */
function template(r: () => number): [string, string, string] {
  const day = () => DAYS[1 + Math.floor(r() * 5)]
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const x = r()
  if (x < 0.3) {
    const n = pick([1, 1, 1, 2, 2, 3, 5])
    const text =
      n === 1
        ? pick([`${day()} annual leave`, 'One day annual leave', `${day()} – Annual Leave`])
        : n === 2
          ? `${day()} and ${day()} annual leave`
          : `${n} Day Annual`
    return [text, `${n} Day`, '']
  }
  if (x < 0.55) return [pick([`${day()} Day OFF`, `Weekly off on ${day()}`, `${day()} + Friday day OFF`]), '', '']
  if (x < 0.67) return [pick([`Morning shift on ${day()}`, `${day()} night shift`, `${day()} and ${day()} – Morning Shift`]), '', '']
  if (x < 0.79) {
    const n = pick([1, 1, 2, 3])
    return [n === 1 ? 'Out of schedule ( Sick )' : `Out of schedule ${n} Day ( Sick )`, '', 'Sick']
  }
  if (x < 0.85) return [pick(['Out of schedule ( Training )', '1 Day Training', '1 Day Outside meeting']), '', '']
  if (x < 0.9) return [pick(['1 day birthday', '1 Day public Holiday']), '1 Day', '']
  if (x < 0.95) return ['Cancel Day OFF', '', '']
  return [pick(['Long 1 Day', 'Swap with colleague']), '', '']
}

export function mockSheet(today = new Date()): SheetTabs {
  const r = rng(20261120)
  const label = (d: Date) => `${format(d, 'd-M')} to ${format(addDays(d, 6), 'd-M')}`
  const first = startOfWeek(new Date(today.getFullYear() - 1, 0, 1), { weekStartsOn: WEEK_STARTS_ON })
  const thisWeek = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
  const last = addDays(thisWeek, 21) // a few weeks ahead (still pending)

  const active = [...ROSTER.filter((n) => !QUIET.has(n)), ...EXTRA]
  const requests: string[][] = [['Name', 'Request \n', 'Status', 'Annual ', 'Week ', 'Note']]
  for (let w = first; w <= last; w = addDays(w, 7)) {
    const future = w > thisWeek
    const count = future ? 2 + Math.floor(r() * 3) : 3 + Math.floor(r() * 4)
    for (let i = 0; i < count; i++) {
      let name = active[Math.floor(r() * active.length)]
      if (VARIANTS[name] && r() < 0.4) name = VARIANTS[name]
      const [text, annual, forced] = template(r)
      let status = forced
      if (future) status = r() < 0.85 ? '' : 'Approved'
      else if (!status) status = r() < 0.9 ? 'Approved' : r() < 0.6 ? 'Rejected' : ''
      requests.push([name, text, status, annual, label(w), ''])
    }
  }
  return {
    requests,
    roster: [['FSR Names ', 'Address'], ...ROSTER.map((n) => [n, ''])],
    aliases: [['Name in requests', 'Correct name'], ...Object.entries(VARIANTS).map(([to, from]) => [from, to])],
  }
}
