import { describe, it, expect } from 'vitest'
import { countInbox, getHistoryActionButton } from '~/utils/finance-history'

// Shared by MT + BP History pages (BUG-043: BP rules are the standard)
describe('countInbox', () => {
  const summaries = [
    { workflowStatus: 'step1_in_progress' },
    { workflowStatus: 'step1_completed' },
    { workflowStatus: 'needs_correction' },
    { workflowStatus: 'step2_completed' },
    { workflowStatus: 'step2_completed_with_notes' },
    { workflowStatus: 'audited' },
    { workflowStatus: 'audited_with_issues' },
    { workflowStatus: 'approved' },
  ]

  it('Manager counts recording, waiting-to-count and sent-back days', () => {
    expect(countInbox(summaries, 'manager')).toBe(3)
  })

  it('Auditor does not count needs_correction', () => {
    expect(countInbox(summaries, 'auditor')).toBe(2)
  })

  it('Owner counts audited days', () => {
    expect(countInbox(summaries, 'owner')).toBe(2)
  })
})

describe('getHistoryActionButton', () => {
  const route = '/finance/money-transfer-service?date=2026-11-05'

  it('keeps the route given by the service', () => {
    expect(getHistoryActionButton('manager', 'step1_in_progress', route).route).toBe(route)
  })

  it('Manager on step1_completed → "ตรวจนับเงิน" primary', () => {
    const btn = getHistoryActionButton('manager', 'step1_completed', route)
    expect(btn.label).toBe('ตรวจนับเงิน')
    expect(btn.variant).toBe('primary')
  })

  it('Manager on needs_correction → "แก้ไข" secondary', () => {
    const btn = getHistoryActionButton('assistant_manager', 'needs_correction', route)
    expect(btn.label).toBe('แก้ไข')
    expect(btn.variant).toBe('secondary')
  })

  it('Auditor on needs_correction → "ดูรายละเอียด" outline (work is with Manager)', () => {
    const btn = getHistoryActionButton('auditor', 'needs_correction', route)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.variant).toBe('outline')
  })

  it('labels have no brackets: step2_completed_with_notes → "ตรวจสอบ", audited_with_issues → "อนุมัติ"', () => {
    expect(getHistoryActionButton('auditor', 'step2_completed_with_notes', route).label).toBe('ตรวจสอบ')
    expect(getHistoryActionButton('owner', 'audited_with_issues', route).label).toBe('อนุมัติ')
  })
})
