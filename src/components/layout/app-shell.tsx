import { CalendarHeart, LayoutDashboard, ListChecks, Menu, Moon, Sun, Users, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useFilters } from '@/context/filters-context'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { useI18n, type Lang } from '@/i18n/i18n-context'
import { cn } from '@/lib/utils'
import { FilterBar } from './filter-bar'

function NavItems({ onNavigate, vertical }: { onNavigate?: () => void; vertical?: boolean }) {
  const { search } = useFilters()
  const { t } = useI18n()
  const nav = [
    { to: '/', label: t.nav.overview, icon: LayoutDashboard, end: true },
    { to: '/employees', label: t.nav.employees, icon: Users, end: false },
    { to: '/requests', label: t.nav.requests, icon: ListChecks, end: false },
  ]
  return (
    <nav className={cn('flex gap-1', vertical && 'flex-col')}>
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={{ pathname: to, search }}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { t, lang, setLang, dir } = useI18n()
  const [open, setOpen] = useState(false)
  const { search } = useFilters()

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t.nav.openMenu}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-64 p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="flex items-center gap-2">
                  <CalendarHeart className="size-5 text-primary" /> {t.appName}
                </SheetTitle>
              </SheetHeader>
              <NavItems vertical onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <NavLink to={{ pathname: '/', search }} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <CalendarHeart className="size-4" aria-hidden />
            </span>
            <span className="hidden min-[420px]:inline">{t.appName}</span>
          </NavLink>

          <div className="ms-4 hidden md:block">
            <NavItems />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <SegmentedSwitch<Lang>
              label={t.language.group}
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en', label: 'English', short: 'EN', lang: 'en' },
                { value: 'ar', label: 'العربية', short: 'ع', lang: 'ar' },
              ]}
            />
            <SegmentedSwitch<Theme>
              label={t.theme.group}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: t.theme.light, icon: Sun, ariaLabel: t.theme.lightMode },
                { value: 'dark', label: t.theme.dark, icon: Moon, ariaLabel: t.theme.darkMode },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <FilterBar />
        {children}
      </main>
    </div>
  )
}

interface SwitchOption<T extends string> {
  value: T
  label: string
  /** Shown instead of `label` on small screens when there is no icon. */
  short?: string
  icon?: LucideIcon
  ariaLabel?: string
  lang?: string
}

/** Small segmented control (theme, language). Full labels from `sm` up; icons / short labels on phones. */
function SegmentedSwitch<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: SwitchOption<T>[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
      {options.map((o) => {
        const active = value === o.value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel ?? o.label}
            lang={o.lang}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {!Icon && o.short && <span className="sm:hidden">{o.short}</span>}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
