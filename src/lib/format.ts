import { fmt, fromKey } from './dates'

/** "28 Mar 2026" in the current UI language. */
export const formatDate = (key: string) => fmt(fromKey(key), 'd MMM yyyy')
