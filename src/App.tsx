import { Fragment } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { CategoryColorVars } from '@/components/category'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataProvider, useLeaveData } from '@/context/data-context'
import { FilterProvider } from '@/context/filters-context'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeReportPage } from '@/pages/employee-report'
import { EmployeesPage } from '@/pages/employees'
import { OverviewPage } from '@/pages/overview'
import { RequestsPage } from '@/pages/requests'
import { DataCheckPage } from '@/pages/data-check'
import { AlertTriangle, MapPinOff } from 'lucide-react'
import { I18nProvider, useI18n } from '@/i18n/i18n-context'

function Routed() {
  const { error, reload } = useLeaveData()
  const { t } = useI18n()
  if (error) {
    return (
      <Card>
        <EmptyState icon={AlertTriangle} title={t.errors.loadTitle} description={error}>
          <Button variant="outline" onClick={reload}>
            {t.errors.retry}
          </Button>
        </EmptyState>
      </Card>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/:id" element={<EmployeeReportPage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/data-check" element={<DataCheckPage />} />
      <Route
        path="*"
        element={
          <Card>
            <EmptyState icon={MapPinOff} title={t.errors.pageNotFound} />
          </Card>
        }
      />
    </Routes>
  )
}

/**
 * Re-mounts the UI when the language changes so every memoised label (dates, chart axes)
 * is rebuilt in the new language. Data stays loaded; URL filters are kept.
 */
function LanguageScope({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n()
  return <Fragment key={lang}>{children}</Fragment>
}

export default function App() {
  return (
    <HashRouter>
      <I18nProvider>
        <TooltipProvider delayDuration={200}>
          <DataProvider>
            <CategoryColorVars />
            <LanguageScope>
              <FilterProvider>
                <AppShell>
                  <Routed />
                </AppShell>
              </FilterProvider>
            </LanguageScope>
          </DataProvider>
        </TooltipProvider>
      </I18nProvider>
    </HashRouter>
  )
}
