import { CalendarHeart, LayoutDashboard, ListChecks, Menu, Moon, Sun, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useFilters } from '@/context/filters-context'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { FilterBar } from './filter-bar'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users, end: false },
  { to: '/requests', label: 'Requests', icon: ListChecks, end: false },
]

function NavItems({ onNavigate, vertical }: { onNavigate?: () => void; vertical?: boolean }) {
  const { search } = useFilters()
  return (
    <nav className={cn('flex gap-1', vertical && 'flex-col')}>
      {NAV.map(({ to, label, icon: Icon, end }) => (
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
  const [open, setOpen] = useState(false)
  const { search } = useFilters()

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="flex items-center gap-2">
                  <CalendarHeart className="size-5 text-primary" /> Leave Tracker
                </SheetTitle>
              </SheetHeader>
              <NavItems vertical onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <NavLink to={{ pathname: '/', search }} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <CalendarHeart className="size-4" aria-hidden />
            </span>
            <span>Leave Tracker</span>
          </NavLink>

          <div className="ml-4 hidden md:block">
            <NavItems />
          </div>

          <div className="ml-auto">
            <ThemeSwitch theme={theme} onChange={setTheme} />
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

/** Light / Dark segmented switch (labels hidden on very small screens, icons always shown). */
function ThemeSwitch({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ]
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} mode`}
            onClick={() => onChange(value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
