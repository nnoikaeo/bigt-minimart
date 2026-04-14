/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'

const {
  formatBillType,
  formatTransactionType,
  formatWorkflowStatus,
  validateTransactionForm,
  calculateExpectedCash,
  diffExpectedVsActual,
  getSmartActionButton,
  formatDiff,
} = useBillPaymentHelpers()

// ─── formatBillType ──────────────────────────────────────────────────────────

describe('formatBillType', () => {
  it('returns Thai label for utility', () => {
    expect(formatBillType('utility')).toBe('สาธารณูปโภค')
  })

  it('returns Thai label for telecom', () => {
    expect(formatBillType('telecom')).toBe('โทรคมนาคม')
  })

  it('returns Thai label for insurance', () => {
    expect(formatBillType('insurance')).toBe('ประกันภัย')
  })

  it('returns Thai label for other', () => {
    expect(formatBillType('other')).toBe('อื่นๆ')
  })

  it('returns dash when type is undefined', () => {
    expect(formatBillType(undefined)).toBe('-')
  })
})

// ─── formatTransactionType ───────────────────────────────────────────────────

describe('formatTransactionType', () => {
  it('returns Thai label for bill_payment', () => {
    expect(formatTransactionType('bill_payment')).toBe('รับชำระบิล')
  })

  it('returns Thai label for owner_deposit', () => {
    expect(formatTransactionType('owner_deposit')).toBe('ฝากเงิน')
  })
})

// ─── formatWorkflowStatus ────────────────────────────────────────────────────

describe('formatWorkflowStatus', () => {
  it('returns correct label and color for step1_in_progress', () => {
    const result = formatWorkflowStatus('step1_in_progress')
    expect(result.label).toBe('กำลังบันทึก')
    expect(result.colorClass).toBe('text-yellow-600')
  })

  it('returns correct label for needs_correction', () => {
    const result = formatWorkflowStatus('needs_correction')
    expect(result.label).toBe('ส่งกลับแก้ไข')
    expect(result.colorClass).toBe('text-red-600')
  })

  it('returns correct label for approved', () => {
    const result = formatWorkflowStatus('approved')
    expect(result.label).toBe('อนุมัติแล้ว')
    expect(result.colorClass).toBe('text-green-600')
  })
})

// ─── validateTransactionForm ─────────────────────────────────────────────────

describe('validateTransactionForm', () => {
  it('is valid for a complete bill_payment form', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: 'utility',
      amount: 2000,
      commission: 20,
      status: 'success',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('is valid for a complete owner_deposit form (no billType or commission)', () => {
    const result = validateTransactionForm({
      transactionType: 'owner_deposit',
      amount: 5000,
      commission: '',
      status: 'success',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects when transactionType is empty', () => {
    const result = validateTransactionForm({
      transactionType: '',
      amount: 1000,
      commission: 10,
      status: 'success',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('กรุณาเลือกประเภทรายการ')
  })

  it('rejects bill_payment without billType', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: '',
      amount: 1000,
      commission: 10,
      status: 'success',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('กรุณาเลือกประเภทบิล')
  })

  it('rejects when amount is empty', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: 'utility',
      amount: '',
      commission: 10,
      status: 'success',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('กรุณากรอกจำนวนเงิน')
  })

  it('rejects when amount is zero or negative', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: 'utility',
      amount: 0,
      commission: 10,
      status: 'success',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('จำนวนเงินต้องมากกว่า 0')
  })

  it('rejects bill_payment without commission', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: 'utility',
      amount: 1000,
      commission: '',
      status: 'success',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('กรุณากรอกค่าธรรมเนียม')
  })

  it('rejects when status is empty', () => {
    const result = validateTransactionForm({
      transactionType: 'bill_payment',
      billType: 'utility',
      amount: 1000,
      commission: 10,
      status: '',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('กรุณาเลือกสถานะรายการ')
  })
})

// ─── calculateExpectedCash ───────────────────────────────────────────────────

describe('calculateExpectedCash', () => {
  /**
   * WORKFLOWS.md Real-World Example (WF 3.1):
   * Txn1: bill_payment utility 2000/20 success → billPaymentCash +2000, serviceFeeCash +20
   * Txn2: bill_payment telecom 1200/0  FAILED  → no change
   * Txn3: owner_deposit       5000/0  success → no change (bank only)
   * Txn4: bill_payment telecom 1200/20 success → billPaymentCash +1200, serviceFeeCash +20
   * Expected: billPaymentCash=3200, serviceFeeCash=40
   */
  const workflowsExampleTransactions = [
    { transactionType: 'bill_payment', amount: 2000, commission: 20, status: 'completed' },
    { transactionType: 'bill_payment', amount: 1200, commission: 0, status: 'cancelled' },
    { transactionType: 'owner_deposit', amount: 5000, commission: 0, status: 'completed' },
    { transactionType: 'bill_payment', amount: 1200, commission: 20, status: 'completed' },
  ]

  it('calculates billPaymentCash=3200 and serviceFeeCash=40 from WORKFLOWS.md example', () => {
    const result = calculateExpectedCash(workflowsExampleTransactions)
    expect(result.billPaymentCash).toBe(3200)
    expect(result.serviceFeeCash).toBe(40)
  })

  it('does not count cancelled transactions', () => {
    const result = calculateExpectedCash([
      { transactionType: 'bill_payment', amount: 1200, commission: 10, status: 'cancelled' },
    ])
    expect(result.billPaymentCash).toBe(0)
    expect(result.serviceFeeCash).toBe(0)
  })

  it('does not count owner_deposit into cash balances', () => {
    const result = calculateExpectedCash([
      { transactionType: 'owner_deposit', amount: 5000, commission: 0, status: 'completed' },
    ])
    expect(result.billPaymentCash).toBe(0)
    expect(result.serviceFeeCash).toBe(0)
  })

  it('returns zero balances for empty list', () => {
    const result = calculateExpectedCash([])
    expect(result.billPaymentCash).toBe(0)
    expect(result.serviceFeeCash).toBe(0)
  })
})

// ─── diffExpectedVsActual ────────────────────────────────────────────────────

describe('diffExpectedVsActual', () => {
  it('returns zero diff and no discrepancy when values match', () => {
    const result = diffExpectedVsActual(3200, 3200)
    expect(result.diff).toBe(0)
    expect(result.hasDiscrepancy).toBe(false)
  })

  it('returns positive diff when expected > actual', () => {
    const result = diffExpectedVsActual(3200, 3000)
    expect(result.diff).toBe(200)
    expect(result.hasDiscrepancy).toBe(true)
  })

  it('returns negative diff when expected < actual', () => {
    const result = diffExpectedVsActual(3000, 3200)
    expect(result.diff).toBe(-200)
    expect(result.hasDiscrepancy).toBe(true)
  })
})

// ─── formatDiff ──────────────────────────────────────────────────────────────

describe('formatDiff', () => {
  it('returns ✅ ตรงกัน for zero', () => {
    expect(formatDiff(0)).toBe('✅ ตรงกัน')
  })

  it('returns dash for null', () => {
    expect(formatDiff(null)).toBe('-')
  })
})

// ─── getSmartActionButton — all 9 WF 3.0 table combinations ─────────────────

describe('getSmartActionButton', () => {
  const date = '2026-01-29'
  const serviceRoute = `/finance/bill-payment-service?date=${date}`
  // After single-page refactor, auditor and owner routes all point to the same service page
  const auditorRoute = serviceRoute
  const ownerRoute = serviceRoute

  // Row 1: manager + step1_in_progress
  it('manager/step1_in_progress → "ทำงาน" primary to service page', () => {
    const btn = getSmartActionButton('manager', 'step1_in_progress', date)
    expect(btn.label).toBe('ทำงาน')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('primary')
  })

  // Row 2: manager + needs_correction
  it('manager/needs_correction → "แก้ไข" secondary to service page', () => {
    const btn = getSmartActionButton('manager', 'needs_correction', date)
    expect(btn.label).toBe('แก้ไข')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('secondary')
  })

  // Row 3: manager + step2_completed → read-only
  it('manager/step2_completed → "ดูรายละเอียด" outline to service page', () => {
    const btn = getSmartActionButton('manager', 'step2_completed', date)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 3 also covers: assistant_manager
  it('assistant_manager/step1_in_progress → "ทำงาน" primary', () => {
    const btn = getSmartActionButton('assistant_manager', 'step1_in_progress', date)
    expect(btn.label).toBe('ทำงาน')
    expect(btn.variant).toBe('primary')
  })

  // Row 4: auditor + step2_completed
  it('auditor/step2_completed → "ตรวจสอบ" primary to auditor-review page', () => {
    const btn = getSmartActionButton('auditor', 'step2_completed', date)
    expect(btn.label).toBe('ตรวจสอบ')
    expect(btn.route).toBe(auditorRoute)
    expect(btn.variant).toBe('primary')
  })

  // Row 5: auditor + step2_completed_with_notes
  it('auditor/step2_completed_with_notes → "ตรวจสอบ" primary to auditor-review page', () => {
    const btn = getSmartActionButton('auditor', 'step2_completed_with_notes', date)
    expect(btn.label).toBe('ตรวจสอบ')
    expect(btn.route).toBe(auditorRoute)
    expect(btn.variant).toBe('primary')
  })

  // Row 6: auditor + audited
  it('auditor/audited → "ดูการตรวจสอบ" outline to auditor-review page', () => {
    const btn = getSmartActionButton('auditor', 'audited', date)
    expect(btn.label).toBe('ดูการตรวจสอบ')
    expect(btn.route).toBe(auditorRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 6b: auditor + audited_with_issues
  it('auditor/audited_with_issues → "ดูการตรวจสอบ" outline to auditor-review page', () => {
    const btn = getSmartActionButton('auditor', 'audited_with_issues', date)
    expect(btn.label).toBe('ดูการตรวจสอบ')
    expect(btn.route).toBe(auditorRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 7: auditor + step1_in_progress → read-only
  it('auditor/step1_in_progress → "ดูรายละเอียด" outline to service page', () => {
    const btn = getSmartActionButton('auditor', 'step1_in_progress', date)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 8: owner + audited
  it('owner/audited → "อนุมัติ" primary to owner-approval page', () => {
    const btn = getSmartActionButton('owner', 'audited', date)
    expect(btn.label).toBe('อนุมัติ')
    expect(btn.route).toBe(ownerRoute)
    expect(btn.variant).toBe('primary')
  })

  // Row 8b: owner + audited_with_issues can also be approved
  it('owner/audited_with_issues → "อนุมัติ" primary to owner-approval page', () => {
    const btn = getSmartActionButton('owner', 'audited_with_issues', date)
    expect(btn.label).toBe('อนุมัติ')
    expect(btn.route).toBe(ownerRoute)
    expect(btn.variant).toBe('primary')
  })

  // Row 9: owner + approved
  it('owner/approved → "ดูรายละเอียด" outline to owner-approval page', () => {
    const btn = getSmartActionButton('owner', 'approved', date)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.route).toBe(ownerRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 9b: owner + step1_in_progress → read-only
  it('owner/step1_in_progress → "ดูรายละเอียด" outline to service page', () => {
    const btn = getSmartActionButton('owner', 'step1_in_progress', date)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('outline')
  })

  // Row 9c: owner + step2_completed → read-only on service page
  it('owner/step2_completed → "ดูรายละเอียด" outline to service page', () => {
    const btn = getSmartActionButton('owner', 'step2_completed', date)
    expect(btn.label).toBe('ดูรายละเอียด')
    expect(btn.route).toBe(serviceRoute)
    expect(btn.variant).toBe('outline')
  })
})
