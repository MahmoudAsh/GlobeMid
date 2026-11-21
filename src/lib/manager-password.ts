/** The manager password is kept for the browser tab session only (never in localStorage, never in the code). */
const KEY = 'leave-tracker-manager-password'

export function getSavedPassword(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
export function savePassword(pw: string) {
  try {
    sessionStorage.setItem(KEY, pw)
  } catch {
    /* storage unavailable */
  }
}
export function forgetPassword() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
