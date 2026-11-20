import type { Dict } from './en'

/** Arabic plural forms: 1 → "طلب واحد", 2 → "طلبان", 3–10 → "3 طلبات", 11+ (and 0) → "11 طلبًا". */
function arPlural(n: number, f: { one: string; two: string; few: string; many: string; unit: string }) {
  if (!Number.isInteger(n)) return `${n} ${f.unit}`
  if (n === 0) return `0 ${f.many}`
  if (n === 1) return f.one
  if (n === 2) return f.two
  const mod = n % 100
  if (mod >= 3 && mod <= 10) return `${n} ${f.few}`
  return `${n} ${f.many}`
}
const days = (n: number) => arPlural(n, { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا', unit: 'يوم' })
const requests = (n: number) => arPlural(n, { one: 'طلب واحد', two: 'طلبان', few: 'طلبات', many: 'طلبًا', unit: 'طلب' })
const people = (n: number) => arPlural(n, { one: 'شخص واحد', two: 'شخصان', few: 'أشخاص', many: 'شخصًا', unit: 'شخص' })

export const ar: Dict = {
  appName: 'متابعة الإجازات',
  nav: { overview: 'نظرة عامة', employees: 'الموظفون', requests: 'الطلبات', dataCheck: 'مراجعة البيانات', openMenu: 'فتح القائمة' },
  theme: { group: 'المظهر', light: 'فاتح', dark: 'داكن', lightMode: 'الوضع الفاتح', darkMode: 'الوضع الداكن' },
  language: { group: 'اللغة' },

  period: { week: 'أسبوع', month: 'شهر', year: 'سنة', all: 'كل الفترات', previous: 'الفترة السابقة', next: 'الفترة التالية', reset: 'إعادة ضبط' },
  filters: { category: 'التصنيف', status: 'الحالة', allCategories: 'كل التصنيفات', allStatuses: 'كل الحالات', clear: 'مسح' },
  category: {
    annual: 'سنوية',
    sick: 'مرضية',
    publicHoliday: 'إجازة رسمية',
    birthday: 'عيد ميلاد',
    dayOff: 'يوم راحة / تغيير راحة',
    cancelledOff: 'إلغاء راحة / يوم بديل',
    shift: 'تغيير وردية',
    training: 'تدريب / خارج',
    emergency: 'طوارئ',
    bereavement: 'حالة وفاة',
    wedding: 'زواج',
    outOfSchedule: 'خارج الجدول',
    noShow: 'غياب',
    leaving: 'ترك العمل',
    other: 'أخرى',
  },
  status: { approved: 'مقبول', rejected: 'مرفوض', not_marked: 'غير محدد' },

  units: {
    days: (formatted, n) => days(n).replace(String(n), formatted),
    daysShort: (formatted) => `${formatted} يوم`,
    approx: '≈',
    approxHint: 'تقريبي — مأخوذ من الرقم المكتوب في نص الطلب',
    rows: requests,
    people,
  },

  common: {
    noRows: 'لا توجد طلبات في هذه الفترة',
    tryAnother: 'جرّب فترة أخرى أو امسح عوامل التصفية.',
    inThisPeriod: 'في هذه الفترة',
    annualColumn: 'من عمود Annual',
    newestFirst: 'الأحدث أولًا',
    total: 'الإجمالي',
    week: 'الأسبوع',
    notInFsr: 'غير موجود في قائمة FSR',
    notInFsrHint: 'هذا الشخص موجود في الشيت لكنه ليس في قائمة FSRs',
    writtenAs: (raw) => `مكتوب «${raw}»`,
    row: (n) => `صف ${n}`,
    note: 'ملاحظة',
  },

  overview: {
    title: 'نظرة عامة',
    subtitle: (label) => `الطلبات الأسبوعية · ${label}`,
    requests: 'الطلبات',
    annualDays: 'أيام سنوية',
    approved: 'مقبول',
    rejected: 'مرفوض',
    notMarked: 'غير محدد',
    notMarkedHint: 'بدون حالة مكتوبة',
    onLeaveThisWeek: 'في إجازة هذا الأسبوع',
    onLeaveThisWeekHint: (label) => `أشخاص · ${label}`,
    chartTitle: 'الأيام السنوية',
    chartBy: { week: 'هذا الأسبوع', month: 'حسب الأسبوع', year: 'حسب الشهر', all: 'حسب الشهر' },
    chartSubtitle: (label, by) => `${label}، ${by} · من عمود Annual`,
    byCategory: 'الطلبات حسب التصنيف',
    byCategorySubtitle: 'الطلب الواحد قد يندرج تحت أكثر من تصنيف',
    topAnnual: 'الأعلى في الأيام السنوية',
    thisWeek: 'طلبات هذا الأسبوع',
    thisWeekSubtitle: (label) => `أسبوع الشيت الحالي · ${label}`,
    nothingThisWeek: 'لا توجد طلبات في الأسبوع الحالي',
  },

  chart: { noData: 'لا توجد أيام سنوية في هذه الفترة.', tooltipRows: requests },

  employees: {
    title: 'الموظفون',
    subtitle: (n, label) => `${people(n)} · ${label}`,
    search: 'ابحث بالاسم',
    searchLabel: 'البحث في الموظفين',
    noMatch: 'لا يوجد موظفون مطابقون للبحث',
    scope: { fsr: 'قائمة FSR فقط', all: 'الجميع' },
    col: {
      name: 'الاسم',
      requests: 'الطلبات',
      approved: 'مقبول',
      rejected: 'مرفوض',
      notMarked: 'غير محدد',
      annualDays: 'أيام سنوية',
      sickDays: 'مرضي ≈',
      holidays: 'رسمية ≈',
      birthdays: 'أعياد ميلاد',
      offChanges: 'تغيير راحة',
      cancelledOffs: 'إلغاء راحة',
      fsrUsed: 'Annual Used في FSR',
      computedUsed: 'المحسوب',
    },
    totalRow: (n) => `الإجمالي (${n})`,
    footnote: (since) =>
      `أعمدة الفترة تتبع الفلتر. «Annual Used» هو العدّاد اليدوي في الشيت؛ «المحسوب» = الأيام السنوية في الشيت منذ ${since} (بداية هذا العدّاد). ⚠ = يوجد اختلاف. ≈ = أيام تقريبية.`,
    mismatch: (fsr, computed) => `الشيت يقول ${fsr}، والصفوف مجموعها ${computed}`,
  },

  report: {
    back: 'كل الموظفين',
    requests: 'الطلبات',
    annualDays: 'أيام سنوية',
    fsrVsComputed: 'FSR مقابل المحسوب',
    fsrVsComputedHint: (since) => `عدّاد FSR / الصفوف منذ ${since}`,
    byCategory: 'حسب التصنيف',
    variants: 'طرق كتابة الاسم',
    variantsHint: 'كتابات مختلفة في الشيت تم دمجها لهذا الشخص',
    weeks: 'الطلبات حسب الأسبوع',
    notFound: 'الموظف غير موجود',
    notFoundHint: 'هذا الشخص غير موجود في الشيت.',
    noRows: (name) => `لا توجد طلبات لـ ${name} في الشيت بعد.`,
  },

  requests: {
    title: 'الطلبات',
    subtitle: (n, label) => `${requests(n)} · ${label} · الأحدث أولًا`,
    search: 'ابحث بالاسم أو الطلب أو الملاحظة',
    searchLabel: 'البحث في الطلبات',
    noMatch: 'لا توجد طلبات مطابقة للبحث.',
    range: (from, to, total) => `${from}–${to} من ${total}`,
    page: (p, of) => `صفحة ${p} / ${of}`,
    prev: 'السابق',
    next: 'التالي',
    prevPage: 'الصفحة السابقة',
    nextPage: 'الصفحة التالية',
    col: {
      row: 'الصف',
      employee: 'الموظف',
      week: 'الأسبوع',
      request: 'الطلب',
      categories: 'التصنيفات',
      status: 'الحالة',
      annual: 'سنوي',
      other: 'أخرى ≈',
    },
  },

  dataCheck: {
    title: 'مراجعة البيانات',
    subtitle: 'استخدم هذه الصفحة لمراجعة الأرقام مع المدير',
    summary: 'ملخص الملف',
    rawRows: 'سطور الملف',
    parsedRows: 'الصفوف المستخدمة',
    rawStatuses: 'عمود الحالة كما هو مكتوب',
    empty: '(فارغ)',
    unparsedWeeks: 'صفوف لم يُقرأ أسبوعها',
    unparsedWeeksHint: 'الصيغة المتوقعة «14-11 to 20-11». هذه الصفوف لا تدخل في أي رقم.',
    emptyNames: 'صفوف بدون اسم (تم تخطيها)',
    nonSaturday: 'أسابيع لا تبدأ يوم السبت',
    nonSaturdayHint: 'أسابيع الشيت من السبت إلى الجمعة؛ قد يكون بها خطأ كتابي.',
    unmatched: 'أسماء ليست في قائمة FSR ولا في name-aliases.json',
    unmatchedHint: 'أشخاص حقيقيون (موظفون آخرون) أو كتابة يجب إضافتها إلى src/data/name-aliases.json.',
    unclassified: 'نصوص طلبات بدون تصنيف',
    unclassifiedHint: 'أضف كلمات مفتاحية في src/lib/sheet/classifier.ts.',
    fsr: '«Annual Used» في FSR مقابل المحسوب',
    fsrHint: (since, match, total) => `المحسوب = الأيام السنوية في الشيت منذ ${since}. ${match} من ${total} متطابقون.`,
    allGood: 'لا يوجد ما يحتاج إصلاح',
    colRow: 'الصف',
    colName: 'الاسم',
    colWeek: 'الأسبوع',
    colText: 'النص',
    colCount: 'عدد الصفوف',
    colRows: 'صفوف الشيت',
    colFsr: 'FSR',
    colComputed: 'المحسوب',
    colAllTime: 'كل الصفوف',
    colDiff: 'الفرق',
    colStart: 'البداية المقروءة',
  },

  errors: { loadTitle: 'تعذّر تحميل الشيت', retry: 'إعادة المحاولة', pageNotFound: 'الصفحة غير موجودة' },
}
