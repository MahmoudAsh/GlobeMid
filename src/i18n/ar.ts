import type { Dict } from './en'

/**
 * Arabic plural forms: 1 → "طلب واحد", 2 → "طلبان", 3–10 → "3 طلبات", 11+ (and 0) → "11 طلبًا".
 * Non-whole numbers (e.g. 1.5 days) use the singular: "1.5 يوم".
 */
function arPlural(n: number, f: { one: string; two: string; few: string; many: string; zero?: string; unit: string }) {
  if (!Number.isInteger(n)) return `${n} ${f.unit}`
  if (n === 0) return f.zero ?? `0 ${f.few}`
  if (n === 1) return f.one
  if (n === 2) return f.two
  const mod = n % 100
  if (mod >= 3 && mod <= 10) return `${n} ${f.few}`
  return `${n} ${f.many}`
}

const days = (n: number) => arPlural(n, { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا', unit: 'يوم' })
const requests = (n: number) => arPlural(n, { one: 'طلب واحد', two: 'طلبان', few: 'طلبات', many: 'طلبًا', unit: 'طلب' })
const people = (n: number) => arPlural(n, { one: 'موظف واحد', two: 'موظفان', few: 'موظفين', many: 'موظفًا', unit: 'موظف' })

export const ar: Dict = {
  appName: 'متابعة الإجازات',
  nav: { overview: 'نظرة عامة', employees: 'الموظفون', requests: 'الطلبات', openMenu: 'فتح القائمة' },
  theme: { group: 'المظهر', light: 'فاتح', dark: 'داكن', lightMode: 'الوضع الفاتح', darkMode: 'الوضع الداكن' },
  language: { group: 'اللغة' },

  period: {
    week: 'أسبوع',
    month: 'شهر',
    year: 'سنة',
    all: 'كل الفترات',
    weekOf: (date) => `أسبوع ${date}`,
    previous: 'الفترة السابقة',
    next: 'الفترة التالية',
    today: 'اليوم',
  },
  filters: {
    department: 'القسم',
    type: 'نوع الإجازة',
    status: 'الحالة',
    allDepartments: 'كل الأقسام',
    allTypes: 'كل الأنواع',
    allStatuses: 'كل الحالات',
    clear: 'مسح',
  },
  leaveType: { Annual: 'سنوية', Sick: 'مرضية', Casual: 'عارضة', Unpaid: 'بدون أجر', Other: 'أخرى' },
  status: { approved: 'مقبولة', rejected: 'مرفوضة', pending: 'قيد المراجعة' },

  units: {
    days: (n, formatted) => days(n).replace(String(n), formatted),
    daysShort: (formatted) => `${formatted} يوم`,
    requests,
    people,
  },

  common: {
    noLeaveTitle: 'لا توجد إجازات في هذه الفترة',
    tryAnother: 'جرّب فترة أخرى أو امسح عوامل التصفية.',
    inThisPeriod: 'في هذه الفترة',
    workingDays: 'أيام عمل',
    newestFirst: 'الأحدث أولًا',
    searchNameOrReason: 'ابحث بالاسم أو السبب',
    total: 'الإجمالي',
    noDepartment: 'بدون قسم',
  },

  overview: {
    title: 'نظرة عامة',
    subtitle: (label) => `إجازات الفريق · ${label}`,
    totalRequests: 'إجمالي الطلبات',
    approvedDays: 'الأيام المعتمدة',
    approved: 'مقبولة',
    rejected: 'مرفوضة',
    pending: 'قيد المراجعة',
    onLeaveToday: 'في إجازة اليوم',
    onLeaveTodayHint: 'إجازات معتمدة، حتى اليوم',
    chartTitle: 'أيام الإجازة المعتمدة',
    chartBy: { week: 'حسب اليوم', month: 'حسب الأسبوع', year: 'حسب الشهر', all: 'حسب الشهر' },
    chartSubtitle: (label, by) => `${label}، ${by}، مقسّمة حسب نوع الإجازة`,
    byType: 'حسب نوع الإجازة',
    byTypeSubtitle: 'الطلبات والأيام المعتمدة',
    top5: 'الأعلى 5 في الأيام المعتمدة',
    whosOff: 'من في إجازة هذا الأسبوع',
    whosOffSubtitle: 'الأسبوع الحالي · مقبولة وقيد المراجعة',
    nobodyOff: 'لا أحد في إجازة هذا الأسبوع',
  },

  chart: {
    noApprovedDays: 'لا توجد أيام إجازة معتمدة في هذه الفترة.',
    noApprovedLeave: 'لا توجد إجازات معتمدة',
    stackedSubtitle: (label) => `${label}، مقسّمة حسب نوع الإجازة`,
  },
  breakdown: { approvedDays: (formatted) => `أيام معتمدة: ${formatted}` },

  employees: {
    title: 'الموظفون',
    subtitle: (n, label) => `${people(n)} · ${label}`,
    search: 'ابحث بالاسم أو القسم',
    searchLabel: 'البحث في الموظفين',
    noMatch: 'لا يوجد موظفون مطابقون للبحث',
    col: {
      name: 'الاسم',
      department: 'القسم',
      requests: 'الطلبات',
      approved: 'مقبولة',
      rejected: 'مرفوضة',
      pending: 'قيد المراجعة',
      approvedDays: 'الأيام المعتمدة',
      lastLeave: 'آخر إجازة',
    },
    totalRow: (n) => `الإجمالي (${n})`,
    footnote: 'أعمدة السنوية / المرضية / العارضة تعرض الأيام المعتمدة. «آخر إجازة» هي تاريخ بداية أحدث إجازة معتمدة.',
  },

  report: {
    back: 'كل الموظفين',
    requestsSubmitted: 'الطلبات المقدّمة',
    approvedRequests: (n) => `${requests(n)} مقبولة`,
    approvalRate: 'نسبة القبول',
    approvalRateHint: 'من الطلبات التي تم البت فيها',
    allRequests: 'كل الطلبات',
    notFound: 'الموظف غير موجود',
    notFoundHint: 'هذا الشخص غير موجود في جدول الإجازات.',
    neverRequested: (name) => `لم يقدّم ${name} أي طلب إجازة بعد.`,
  },

  requests: {
    title: 'الطلبات',
    subtitle: (n, label) => `${requests(n)} · ${label} · الأحدث أولًا`,
    searchLabel: 'البحث في الطلبات',
    noMatch: 'لا توجد طلبات مطابقة للبحث.',
    range: (from, to, total) => `${from}–${to} من ${total}`,
    page: (p, of) => `صفحة ${p} / ${of}`,
    prev: 'السابق',
    next: 'التالي',
    prevPage: 'الصفحة السابقة',
    nextPage: 'الصفحة التالية',
    col: {
      employee: 'الموظف',
      dates: 'التواريخ',
      type: 'النوع',
      days: 'الأيام',
      reason: 'السبب',
      status: 'الحالة',
      submitted: 'تاريخ التقديم',
    },
    inPeriod: (formatted) => `(${formatted} في الفترة)`,
    partlyInPeriod: 'جزء فقط من هذا الطلب يقع داخل الفترة المحددة',
  },

  errors: {
    loadTitle: 'تعذّر تحميل بيانات الإجازات',
    retry: 'إعادة المحاولة',
    pageNotFound: 'الصفحة غير موجودة',
  },
}
