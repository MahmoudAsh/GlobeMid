import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadLeaveData } from '@/lib/data-source'
import type { Employee, LeaveData } from '@/lib/types'

interface DataState {
  loading: boolean
  error: string | null
  data: LeaveData
  employeesById: Map<string, Employee>
  reload: () => void
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LeaveData>({ employees: [], requests: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadLeaveData()
      .then((d) => !cancelled && setData(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const value = useMemo<DataState>(
    () => ({ loading, error, data, employeesById: new Map(data.employees.map((e) => [e.id, e])), reload }),
    [loading, error, data, reload],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useLeaveData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useLeaveData must be used inside <DataProvider>')
  return ctx
}
