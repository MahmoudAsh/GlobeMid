import { CalendarHeart, LayoutDashboard, ListChecks, Menu, Moon, Sun, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFilters } from '@/context/filters-context'
import { useTheme } from '@/hooks/use-theme'
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
  const { theme, toggle } = useTheme()
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
                  {theme === 'dark' ? <Sun /> : <Moon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>
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
