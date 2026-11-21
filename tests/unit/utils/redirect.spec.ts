import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '~/utils/redirect'

describe('safeRedirectPath (BUG-054)', () => {
  it('keeps a same-site path with its query', () => {
    expect(safeRedirectPath('/finance/money-transfer-service?date=2026-10-17'))
      .toBe('/finance/money-transfer-service?date=2026-10-17')
  })

  it('uses the first value when the query has several', () => {
    expect(safeRedirectPath(['/finance', '/other'])).toBe('/finance')
  })

  it.each([undefined, null, '', 'finance', 'https://evil.example', '//evil.example', '/\\evil.example', 42])(
    'falls back to "/" for %s',
    (value: unknown) => {
      expect(safeRedirectPath(value)).toBe('/')
    }
  )

  it('does not send the user back to the login page', () => {
    expect(safeRedirectPath('/login')).toBe('/')
    expect(safeRedirectPath('/login?redirect=/finance')).toBe('/')
  })
})
