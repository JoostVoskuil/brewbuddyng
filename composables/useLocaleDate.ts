/**
 * Uniform date/time formatting based on the host (OS) locale settings.
 *
 * All user-facing dates in the application should be rendered through these
 * helpers so the layout is consistent and follows the operating system's
 * regional preferences. `Intl.DateTimeFormat` is created with an `undefined`
 * locale, which resolves to the runtime's default locale — in the browser this
 * mirrors the OS / browser regional settings.
 */
const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Convert a stored value into a Date. Plain `YYYY-MM-DD` strings are parsed as
 * a local calendar date (not UTC midnight) so they never shift a day across
 * time zones.
 */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function useLocaleDate() {
  /** Format a date (no time) using the OS locale, e.g. a brew date. */
  function formatDate(value: string | number | Date | null | undefined): string {
    const d = toDate(value)
    return d ? dateFmt.format(d) : ''
  }

  /** Format a date and time using the OS locale, e.g. a measurement timestamp. */
  function formatDateTime(value: string | number | Date | null | undefined): string {
    const d = toDate(value)
    return d ? dateTimeFmt.format(d) : ''
  }

  return { formatDate, formatDateTime }
}
