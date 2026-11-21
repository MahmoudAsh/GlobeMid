import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { ar as arLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { CategoryDot } from '@/components/category'
import { NotInFsrTag } from '@/components/roster-tag'
import { StatusIcon } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useLeaveData } from '@/context/data-context'
import { useI18n } from '@/i18n/i18n-context'
import { APP_LEAVE_TYPES, APP_STATUSES, daysInRange, validateNewRequest, type AppLeaveType, type AppStatus, type ValidationError } from '@/lib/app-requests/validate'
import { addLeaveRequest, type ApiError } from '@/lib/data-source'
import { formatRangeExact, toKey } from '@/lib/dates'
import { forgetPassword, getSavedPassword, savePassword } from '@/lib/manager-password'
import { cn } from '@/lib/utils'

type FieldError = ValidationError | 'password'

export function AddLeaveRequestSheet({
  open,
  onOpenChange,
  initialEmployee,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialEmployee?: string
}) {
  const { data, reload } = useLeaveData()
  const { t, lang, dir } = useI18n()
  const f = t.form
  // Arabic weekday names are long; use the one-letter form in the calendar header.
  const arWeekdays = lang === 'ar' ? { formatWeekdayName: (d: Date) => format(d, 'EEEEE', { locale: arLocale }) } : undefined

  const [employee, setEmployee] = useState('')
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [day, setDay] = useState<Date | undefined>()
  const [range, setRange] = useState<DateRange | undefined>()
  const [days, setDays] = useState('')
  const [daysTouched, setDaysTouched] = useState(false)
  const [leaveType, setLeaveType] = useState<AppLeaveType | ''>('')
  const [status, setStatus] = useState<AppStatus | ''>('')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)

  // Fresh form every time it opens.
  useEffect(() => {
    if (!open) return
    setEmployee(initialEmployee ?? '')
    setMode('single')
    setDay(undefined)
    setRange(undefined)
    setDays('')
    setDaysTouched(false)
    setLeaveType('')
    setStatus('')
    setReason('')
    setPassword(getSavedPassword())
    setErrors([])
    setApiError(null)
  }, [open, initialEmployee])

  const start = mode === 'single' ? day : range?.from
  const end = mode === 'single' ? day : (range?.to ?? range?.from)
  const maxDays = start && end ? daysInRange(toKey(start), toKey(end)) : 0

  // Default the number of days to the length of the selection until the manager edits it.
  useEffect(() => {
    if (!daysTouched) setDays(maxDays ? String(maxDays) : '')
  }, [maxDays, daysTouched])

  const submit = async () => {
    setApiError(null)
    const payload = {
      employee,
      startDate: start ? toKey(start) : '',
      endDate: end ? toKey(end) : '',
      days: Number(days),
      leaveType,
      reason,
      status,
    }
    const v = validateNewRequest(payload)
    const errs: FieldError[] = v.ok ? [] : [...v.errors]
    if (!password.trim()) errs.push('password')
    setErrors(errs)
    if (!v.ok || errs.length) return
    setSaving(true)
    const res = await addLeaveRequest(v.value, password.trim())
    setSaving(false)
    if (!res.ok) {
      if (res.error === 'wrong-password') forgetPassword()
      setApiError(res.error)
      return
    }
    savePassword(password.trim())
    toast.success(f.saved(v.value.employee))
    onOpenChange(false)
    reload()
  }

  const err = (k: FieldError) => errors.includes(k) && <p className="text-xs text-status-rejected">{f.errors[k]}</p>
  const has = (...k: FieldError[]) => k.some((x) => errors.includes(x))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={dir === 'rtl' ? 'left' : 'right'} className="gap-0 overflow-y-auto data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{f.title}</SheetTitle>
          <SheetDescription>{f.description}</SheetDescription>
        </SheetHeader>

        <form
          className="space-y-5 px-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {/* Employee */}
          <div className="space-y-1.5">
            <Label>{f.employee}</Label>
            <EmployeePicker value={employee} onChange={setEmployee} invalid={has('employee')} />
            {err('employee')}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{f.date}</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'range')}>
                <TabsList>
                  <TabsTrigger value="single">{f.single}</TabsTrigger>
                  <TabsTrigger value="range">{f.range}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className={cn('rounded-lg border', has('startDate', 'endDate', 'endBeforeStart') && 'border-status-rejected')}>
              {mode === 'single' ? (
                <Calendar
                  mode="single"
                  selected={day}
                  onSelect={setDay}
                  weekStartsOn={6}
                  defaultMonth={day ?? new Date()}
                  locale={lang === 'ar' ? arLocale : undefined}
                  formatters={arWeekdays}
                  dir={dir}
                  className="mx-auto"
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  weekStartsOn={6}
                  defaultMonth={range?.from ?? new Date()}
                  locale={lang === 'ar' ? arLocale : undefined}
                  formatters={arWeekdays}
                  dir={dir}
                  className="mx-auto"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {start && end ? f.selected(formatRangeExact(start, end)) : mode === 'single' ? f.pickDate : f.pickRange}
            </p>
            {err('startDate') || err('endDate') || err('endBeforeStart')}
          </div>

          {/* Days */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-days">{f.days}</Label>
            <Input
              id="leave-days"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.5}
              max={maxDays || undefined}
              value={days}
              onChange={(e) => {
                setDays(e.target.value)
                setDaysTouched(true)
              }}
              aria-invalid={has('days', 'daysTooMany') || undefined}
              className="w-32"
            />
            {maxDays > 0 && <p className="text-xs text-muted-foreground">{f.daysHint(maxDays)}</p>}
            {err('days') || err('daysTooMany')}
          </div>

          {/* Leave type */}
          <div className="space-y-1.5">
            <Label>{f.leaveType}</Label>
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v as AppLeaveType)}>
              <SelectTrigger className="w-full" aria-invalid={has('leaveType') || undefined} aria-label={f.leaveType}>
                <SelectValue placeholder={f.leaveTypePlaceholder} />
              </SelectTrigger>
              <SelectContent position="popper">
                {APP_LEAVE_TYPES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryDot category={c} /> {t.category[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err('leaveType')}
          </div>

          {/* Decision */}
          <div className="space-y-1.5">
            <Label id="leave-status">{f.status}</Label>
            <div role="radiogroup" aria-labelledby="leave-status" className="grid grid-cols-2 gap-2">
              {APP_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    status === s
                      ? s === 'approved'
                        ? 'border-status-approved bg-status-approved-bg text-status-approved'
                        : 'border-status-rejected bg-status-rejected-bg text-status-rejected'
                      : 'text-muted-foreground hover:bg-muted',
                    has('status') && status !== s && 'border-status-rejected/50',
                  )}
                >
                  <StatusIcon status={s} className={status === s ? '' : 'text-muted-foreground'} />
                  {t.status[s]}
                </button>
              ))}
            </div>
            {err('status')}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason">{f.reason}</Label>
            <Textarea
              id="leave-reason"
              dir="auto"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={f.reasonPlaceholder}
              maxLength={500}
              rows={3}
            />
            {err('reason')}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-password">{f.password}</Label>
            <Input
              id="leave-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={has('password') || apiError === 'wrong-password' || undefined}
            />
            <p className="text-xs text-muted-foreground">{f.remember}</p>
            {err('password')}
          </div>

          {apiError && (
            <p role="alert" className="rounded-lg bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected">
              {f.errors[apiError]}
            </p>
          )}
          {!data.app.available && !apiError && <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{f.notAvailable}</p>}

          <SheetFooter className="flex-row justify-end gap-2 p-0 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {f.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? f.saving : f.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** Searchable employee picker (everyone in the FSR list + other staff seen in the sheet). */
function EmployeePicker({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  const { data } = useLeaveData()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return data.employees
      .filter((e) => !s || e.name.toLowerCase().includes(s) || e.variants.some((v) => v.raw.toLowerCase().includes(s)))
      .sort((a, b) => Number(b.inFsrList) - Number(a.inFsrList) || a.name.localeCompare(b.name))
  }, [data.employees, q])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQ('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={value ? `${t.form.employee}: ${value}` : t.form.employee}
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || t.form.employeePlaceholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="border-b p-2">
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.form.employeeSearch} aria-label={t.form.employeeSearch} />
        </div>
        <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
          {list.length === 0 && <li className="px-2 py-3 text-center text-sm text-muted-foreground">{t.form.noEmployee}</li>}
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === e.name}
                onClick={() => {
                  onChange(e.name)
                  setOpen(false)
                  setQ('')
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-accent"
              >
                <Check className={cn('size-4 shrink-0', value === e.name ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{e.name}</span>
                {!e.inFsrList && <NotInFsrTag />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
