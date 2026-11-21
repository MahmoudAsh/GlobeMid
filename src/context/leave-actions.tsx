import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AddLeaveRequestSheet } from '@/components/leave-form/add-leave-request'
import { useI18n } from '@/i18n/i18n-context'
import { deleteLeaveRequest } from '@/lib/data-source'
import { formatRangeExact } from '@/lib/dates'
import { forgetPassword, getSavedPassword, savePassword } from '@/lib/manager-password'
import type { LeaveRow } from '@/lib/types'
import { useLeaveData } from './data-context'

interface LeaveActions {
  /** Open the "Add leave request" panel, optionally for a given employee. */
  openAdd: (employee?: string) => void
  /** Delete a request that was added from the dashboard (asks to confirm + password). */
  remove: (row: LeaveRow) => Promise<void>
  /** False when the Cloudflare API/database isn't connected (e.g. local `npm run dev`). */
  canWrite: boolean
}

const Ctx = createContext<LeaveActions | null>(null)

export function LeaveActionsProvider({ children }: { children: ReactNode }) {
  const { data, reload } = useLeaveData()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [employee, setEmployee] = useState<string | undefined>()

  const openAdd = useCallback((name?: string) => {
    setEmployee(name)
    setOpen(true)
  }, [])

  const remove = useCallback(
    async (row: LeaveRow) => {
      if (row.source !== 'app' || !row.appId) return
      const dates = row.exactStart && row.exactEnd ? formatRangeExact(row.exactStart, row.exactEnd) : row.weekLabel
      if (!window.confirm(t.form.deleteConfirm(row.employee, dates))) return
      let pw = getSavedPassword()
      if (!pw) pw = window.prompt(t.form.askPassword) ?? ''
      if (!pw) return
      const res = await deleteLeaveRequest(row.appId, pw)
      if (res.ok) {
        savePassword(pw)
        toast.success(t.form.deleted)
        reload()
      } else {
        if (res.error === 'wrong-password') forgetPassword()
        toast.error(t.form.errors[res.error])
      }
    },
    [reload, t],
  )

  const value = useMemo(() => ({ openAdd, remove, canWrite: data.app.available }), [openAdd, remove, data.app.available])

  return (
    <Ctx.Provider value={value}>
      {children}
      <AddLeaveRequestSheet open={open} onOpenChange={setOpen} initialEmployee={employee} />
    </Ctx.Provider>
  )
}

export function useLeaveActions() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLeaveActions must be used inside <LeaveActionsProvider>')
  return c
}
