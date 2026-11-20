import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { LeaveTypeColorVars } from '@/components/leave-type'
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
import { AlertTriangle, MapPinOff } from 'lucide-react'

function Routed() {
  const { error, reload } = useLeaveData()
  if (error) {
    return (
      <Card>
        <EmptyState icon={AlertTriangle} title="Couldn’t load leave data" description={error}>
          <Button variant="outline" onClick={reload}>
            Try again
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
      <Route
        path="*"
        element={
          <Card>
            <EmptyState icon={MapPinOff} title="Page not found" />
          </Card>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <TooltipProvider delayDuration={200}>
        <DataProvider>
          <FilterProvider>
            <LeaveTypeColorVars />
            <AppShell>
              <Routed />
            </AppShell>
          </FilterProvider>
        </DataProvider>
      </TooltipProvider>
    </HashRouter>
  )
}
