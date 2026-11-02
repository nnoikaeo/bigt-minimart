/**
 * The one date format shown to users: dd/mm/yyyy in the Buddhist Era (01/04/2569).
 * Stored values stay ISO (2026-04-01); only the display is converted.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const pad = (n: number) => String(n).padStart(2, '0')

function toDate(value: string | Date): Date | null {
  // A bare YYYY-MM-DD parses as UTC, so read it as local time to keep the same calendar day
  const parsed = value instanceof Date
    ? value
    : new Date(DATE_ONLY.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatThaiDate(value: string | Date): string {
  const d = toDate(value)
  if (!d) return '-'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543}`
}

export function formatThaiDateTime(value: string | Date): string {
  const d = toDate(value)
  if (!d) return '-'
  return `${formatThaiDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
