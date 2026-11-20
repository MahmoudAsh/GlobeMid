import type { LeaveStatus, LeaveType } from '@/lib/types'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** English strings — the source of truth. `ar.ts` must provide every key (checked by TypeScript). */
export const en = {
  appName: 'Leave Tracker',
  nav: { overview: 'Overview', employees: 'Employees', requests: 'Requests', openMenu: 'Open menu' },
  theme: { group: 'Colour theme', light: 'Light', dark: 'Dark', lightMode: 'Light mode', darkMode: 'Dark mode' },
  language: { group: 'Language' },

  period: {
    week: 'Week',
    month: 'Month',
    year: 'Year',
    all: 'All time',
    weekOf: (date: string) => `Week of ${date}`,
    previous: 'Previous period',
    next: 'Next period',
    today: 'Today',
  },
  filters: {
    department: 'Department',
    type: 'Leave type',
    status: 'Status',
    allDepartments: 'All departments',
    allTypes: 'All types',
    allStatuses: 'All statuses',
    clear: 'Clear',
  },
  leaveType: {
    Annual: 'Annual',
    Sick: 'Sick',
    DayOff: 'Day off',
    Shift: 'Shift change',
    Training: 'Training / outside',
    Holiday: 'Holiday',
    Other: 'Other',
  } satisfies Record<LeaveType, string>,
  status: { approved: 'Approved', rejected: 'Rejected', pending: 'Pending' } satisfies Record<LeaveStatus, string>,

  units: {
    days: (n: number, formatted: string) => `${formatted} ${n === 1 ? 'day' : 'days'}`,
    daysShort: (formatted: string) => `${formatted} d`,
    requests: (n: number) => plural(n, 'request', 'requests'),
    people: (n: number) => plural(n, 'person', 'people'),
  },

  common: {
    noLeaveTitle: 'No leave in this period',
    tryAnother: 'Try another period or clear the filters.',
    inThisPeriod: 'in this period',
    workingDays: 'leave days',
    notInRoster: 'Not in FSRs list',
    notInRosterHint: 'This name appears in requests but not in the FSRs roster tab',
    writtenAs: (raw: string) => `written as “${raw}”`,
    newestFirst: 'Newest first',
    searchNameOrReason: 'Search by name or reason',
    total: 'Total',
    noDepartment: 'No department',
  },

  overview: {
    title: 'Overview',
    subtitle: (label: string) => `Leave across the team · ${label}`,
    totalRequests: 'Total requests',
    approvedDays: 'Approved days',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    onLeaveToday: 'Off this week',
    onLeaveTodayHint: 'people, approved',
    chartTitle: 'Approved leave days',
    chartBy: { week: 'by day', month: 'by week', year: 'by month', all: 'by month' },
    chartSubtitle: (label: string, by: string) => `${label}, ${by}, stacked by leave type`,
    byType: 'By leave type',
    byTypeSubtitle: 'Requests and approved days',
    top5: 'Top 5 by approved days',
    whosOff: 'Who’s off this week',
    whosOffSubtitle: 'Current week · leave, days off, sick, training',
    nobodyOff: 'Nobody is off this week',
  },

  chart: {
    noApprovedDays: 'No approved leave days fall in this period.',
    noApprovedLeave: 'No approved leave',
    stackedSubtitle: (label: string) => `${label}, stacked by leave type`,
  },
  breakdown: { approvedDays: (formatted: string) => `${formatted} approved days` },

  employees: {
    title: 'Employees',
    subtitle: (n: number, label: string) => `${plural(n, 'person', 'people')} · ${label}`,
    search: 'Search by name or department',
    searchName: 'Search by name',
    searchLabel: 'Search employees',
    noMatch: 'No employees match your search',
    col: {
      name: 'Name',
      department: 'Department',
      requests: 'Requests',
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Pending',
      approvedDays: 'Approved days',
      lastLeave: 'Last leave',
    },
    totalRow: (n: number) => `Total (${n})`,
    footnote: 'Annual / Sick columns show approved days. “Last leave” is the week of the latest approved leave or day off.',
  },

  report: {
    back: 'All employees',
    requestsSubmitted: 'Requests submitted',
    approvedRequests: (n: number) => `${plural(n, 'approved request', 'approved requests')}`,
    approvalRate: 'Approval rate',
    approvalRateHint: 'of decided requests',
    allRequests: 'All requests',
    notFound: 'Employee not found',
    notFoundHint: 'This person isn’t in the leave sheet.',
    neverRequested: (name: string) => `${name} hasn’t submitted any leave requests yet.`,
  },

  requests: {
    title: 'Requests',
    subtitle: (n: number, label: string) => `${plural(n, 'request', 'requests')} · ${label} · newest first`,
    searchLabel: 'Search requests',
    noMatch: 'No requests match your search.',
    range: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
    page: (p: number, of: number) => `Page ${p} / ${of}`,
    prev: 'Prev',
    next: 'Next',
    prevPage: 'Previous page',
    nextPage: 'Next page',
    col: {
      employee: 'Employee',
      dates: 'Dates',
      type: 'Type',
      days: 'Days',
      reason: 'Reason',
      status: 'Status',
      submitted: 'Submitted',
    },
    inPeriod: (formatted: string) => `(${formatted} in period)`,
    partlyInPeriod: 'This request is only partly inside the selected period',
  },

  errors: {
    loadTitle: 'Couldn’t load leave data',
    retry: 'Try again',
    pageNotFound: 'Page not found',
  },
}

/** Shape every language must match. */
type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? { [K in keyof T]: Widen<T[K]> }
    : string
export type Dict = Widen<typeof en>
