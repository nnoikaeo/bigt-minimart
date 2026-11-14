import { describe, it, expect } from 'vitest'
import { formatThaiDate, formatThaiDateTime, todayISO } from '~/utils/date'

describe('formatThaiDate', () => {
  it('shows a stored date as dd/mm/Buddhist year', () => {
    expect(formatThaiDate('2026-04-01')).toBe('01/04/2569')
  })

  it('keeps the calendar day of a date-only value', () => {
    expect(formatThaiDate('2026-01-31')).toBe('31/01/2569')
  })

  it('accepts a Date', () => {
    expect(formatThaiDate(new Date(2026, 10, 2))).toBe('02/11/2569')
  })

  it('returns "-" for an invalid value', () => {
    expect(formatThaiDate('not-a-date')).toBe('-')
  })
})

describe('formatThaiDateTime', () => {
  it('adds 24-hour time without seconds', () => {
    expect(formatThaiDateTime(new Date(2026, 10, 2, 7, 5, 30))).toBe('02/11/2569 07:05')
  })

  it('returns "-" for an invalid value', () => {
    expect(formatThaiDateTime('not-a-date')).toBe('-')
  })
})

describe('todayISO', () => {
  it('uses Thai time, not UTC, just after midnight', () => {
    // 5 Nov 2026 00:27 in Bangkok = 4 Nov 17:27 UTC
    expect(todayISO(new Date('2026-11-04T17:27:00Z'))).toBe('2026-11-05')
  })

  it('stays on the same day late in the evening', () => {
    // 5 Nov 2026 23:59 in Bangkok = 5 Nov 16:59 UTC
    expect(todayISO(new Date('2026-11-05T16:59:00Z'))).toBe('2026-11-05')
  })
})
