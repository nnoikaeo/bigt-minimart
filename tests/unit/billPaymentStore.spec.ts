/* eslint-disable */
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBillPaymentStore } from '~/stores/bill-payment'

// ─── Mock Nuxt auto-imports used inside the store ────────────────────────────
// useAuthStore is called as a Nuxt auto-import (no explicit ESM import in the
// store file). Stubbing it as a global makes it available in the test env.
vi.stubGlobal('useAuthStore', () => ({
  user: { uid: 'user-001', displayName: 'Test Manager', email: 'mgr@test.com' },
  isAuthenticated: true,
}))

// ─── $fetch mock ─────────────────────────────────────────────────────────────
// The store calls Nuxt's $fetch global. We stub it before each test.

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal BillPaymentDailySummary for a given workflowStatus */
function buildSummary(workflowStatus: string, overrides = {}) {
  return {
    id: 'summary-2026-01-29',
    date: '2026-01-29',
    workflowStatus,
    step1CompletedAt: null,
    step2CompletedAt: null,
    auditedAt: null,
    approvedAt: null,
    ...overrides,
  }
}

/** Build a minimal BillPaymentBalance */
function buildBalance(overrides = {}) {
  return {
    id: 'balance-2026-01-29',
    date: '2026-01-29',
    bankAccount: 3000,
    billPaymentCash: 0,
    serviceFeeCash: 0,
    ...overrides,
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  mockFetch.mockReset()
})

// ─── Getters ─────────────────────────────────────────────────────────────────

describe('useBillPaymentStore getters', () => {
  it('getCurrentWorkflowStatus defaults to step1_in_progress when no summary', () => {
    const store = useBillPaymentStore()
    expect(store.getCurrentWorkflowStatus).toBe('step1_in_progress')
  })

  it('isStep1Complete is false when step1CompletedAt is null', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step2_completed', { step1CompletedAt: null })
    expect(store.isStep1Complete).toBe(false)
  })

  it('isStep1Complete is true when step1CompletedAt is set', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
    })
    expect(store.isStep1Complete).toBe(true)
  })

  it('isStep2Complete is true when step2CompletedAt is set', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
    })
    expect(store.isStep2Complete).toBe(true)
  })

  it('isAudited is true when auditedAt is set', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('audited', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
      auditedAt: '2026-01-29T14:00:00Z',
    })
    expect(store.isAudited).toBe(true)
  })

  it('isApproved is true for approved status', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('approved')
    expect(store.isApproved).toBe(true)
  })

  it('isApproved is true for approved_with_notes status', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('approved_with_notes')
    expect(store.isApproved).toBe(true)
  })

  it('getDraftTransactions returns all draft transactions during step1_in_progress', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step1_in_progress')
    store.transactions = [
      { id: 'txn-1', date: '2026-01-29', transactionType: 'bill_payment', amount: 1000, status: 'draft' },
      { id: 'txn-2', date: '2026-01-29', transactionType: 'owner_deposit', amount: 5000, status: 'draft' },
    ]
    expect(store.getDraftTransactions).toHaveLength(2)
  })

  it('getDraftTransactions returns transactions during needs_correction', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('needs_correction')
    store.transactions = [
      { id: 'txn-1', date: '2026-01-29', transactionType: 'bill_payment', amount: 1000, status: 'draft' },
    ]
    expect(store.getDraftTransactions).toHaveLength(1)
  })

  it('getDraftTransactions returns empty array after step1 is complete', () => {
    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step2_completed')
    store.transactions = [
      { id: 'txn-1', date: '2026-01-29', transactionType: 'bill_payment', amount: 1000 },
    ]
    expect(store.getDraftTransactions).toHaveLength(0)
  })
})

// ─── State Transitions ───────────────────────────────────────────────────────

describe('completeStep1 transitions workflowStatus to step2_completed', () => {
  it('updates currentSummary with API response', async () => {
    const updatedSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step1_in_progress')

    await store.completeStep1('2026-01-29')

    expect(store.currentSummary.workflowStatus).toBe('step2_completed')
    expect(store.currentSummary.step1CompletedAt).toBe('2026-01-29T11:00:00Z')
  })
})

describe('completeStep2 transitions workflowStatus to step2_completed or step2_completed_with_notes', () => {
  it('updates currentSummary to step2_completed when no discrepancy', async () => {
    const updatedSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('step2_completed')

    await store.completeStep2('2026-01-29', { actualBillPaymentCash: 3200, actualServiceFeeCash: 40 })

    expect(store.currentSummary.workflowStatus).toBe('step2_completed')
    expect(store.currentSummary.step2CompletedAt).toBe('2026-01-29T12:00:00Z')
  })

  it('updates currentSummary to step2_completed_with_notes when discrepancy found', async () => {
    const updatedSummary = buildSummary('step2_completed_with_notes', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    await store.completeStep2('2026-01-29', {
      actualBillPaymentCash: 3000,
      actualServiceFeeCash: 40,
      notes: 'ยอดไม่ตรง 200 บาท',
    })

    expect(store.currentSummary.workflowStatus).toBe('step2_completed_with_notes')
  })
})

describe('submitAudit — all 3 outcomes', () => {
  it('transitions to audited on clean audit', async () => {
    const updatedSummary = buildSummary('audited', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
      auditedAt: '2026-01-29T14:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    await store.submitAudit('2026-01-29', { outcome: 'audited' })

    expect(store.currentSummary.workflowStatus).toBe('audited')
    expect(store.currentSummary.auditedAt).toBe('2026-01-29T14:00:00Z')
  })

  it('transitions to audited_with_issues when issues found', async () => {
    const updatedSummary = buildSummary('audited_with_issues', {
      auditedAt: '2026-01-29T14:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    await store.submitAudit('2026-01-29', { outcome: 'audited_with_issues', notes: 'พบปัญหา' })

    expect(store.currentSummary.workflowStatus).toBe('audited_with_issues')
  })

  it('transitions to needs_correction when auditor requests correction (Approach C)', async () => {
    const updatedSummary = buildSummary('needs_correction', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      // step2CompletedAt cleared by Approach C server logic
      step2CompletedAt: null,
      needsCorrectionFrom: 'auditor',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    // Start from step2_completed
    store.currentSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T12:00:00Z',
    })

    await store.submitAudit('2026-01-29', { outcome: 'needs_correction', notes: 'ยอดไม่ตรง' })

    expect(store.currentSummary.workflowStatus).toBe('needs_correction')
    // Step 2 was cleared (Approach C) — manager must re-verify
    expect(store.currentSummary.step2CompletedAt).toBeNull()
    // Step 1 transactions are preserved (step1CompletedAt still set)
    expect(store.currentSummary.step1CompletedAt).toBe('2026-01-29T11:00:00Z')
  })
})

// ─── needs_correction full round-trip ────────────────────────────────────────

describe('needs_correction loop: auditor → manager → auditor', () => {
  it('manager can re-submit Step 2 after needs_correction', async () => {
    const store = useBillPaymentStore()

    // Step 1: start at needs_correction (auditor sent back, Step 2 cleared, transactions preserved)
    store.currentSummary = buildSummary('needs_correction', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: null,
      needsCorrectionFrom: 'auditor',
    })
    store.transactions = [
      { id: 'txn-1', date: '2026-01-29', transactionType: 'bill_payment', amount: 2000, commission: 20, status: 'completed' },
      { id: 'txn-4', date: '2026-01-29', transactionType: 'bill_payment', amount: 1200, commission: 20, status: 'completed' },
    ]

    // Verify Step 1 transactions are still accessible (not cleared)
    expect(store.getCompletedTransactions).toHaveLength(2)

    // Step 2: Manager re-submits Step 2 verification
    const resubmittedSummary = buildSummary('step2_completed', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T15:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: resubmittedSummary })
    await store.completeStep2('2026-01-29', { actualBillPaymentCash: 3200, actualServiceFeeCash: 40 })

    expect(store.currentSummary.workflowStatus).toBe('step2_completed')
    expect(store.currentSummary.step2CompletedAt).toBe('2026-01-29T15:00:00Z')

    // Step 3: Auditor re-audits and approves
    const reauditedSummary = buildSummary('audited', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: '2026-01-29T15:00:00Z',
      auditedAt: '2026-01-29T16:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: reauditedSummary })
    await store.submitAudit('2026-01-29', { outcome: 'audited' })

    expect(store.currentSummary.workflowStatus).toBe('audited')
  })
})

// ─── submitOwnerApproval ──────────────────────────────────────────────────────

describe('submitOwnerApproval — all 3 decisions', () => {
  it('transitions to approved', async () => {
    const updatedSummary = buildSummary('approved', {
      approvedAt: '2026-01-29T17:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    await store.submitOwnerApproval('2026-01-29', { decision: 'approved' })

    expect(store.currentSummary.workflowStatus).toBe('approved')
  })

  it('transitions to approved_with_notes', async () => {
    const updatedSummary = buildSummary('approved_with_notes', {
      approvedAt: '2026-01-29T17:00:00Z',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    await store.submitOwnerApproval('2026-01-29', { decision: 'approved_with_notes', notes: 'ok แต่มีหมายเหตุ' })

    expect(store.currentSummary.workflowStatus).toBe('approved_with_notes')
  })

  it('transitions to needs_correction from owner', async () => {
    const updatedSummary = buildSummary('needs_correction', {
      step1CompletedAt: '2026-01-29T11:00:00Z',
      step2CompletedAt: null,
      needsCorrectionFrom: 'owner',
    })
    mockFetch.mockResolvedValue({ data: updatedSummary })

    const store = useBillPaymentStore()
    store.currentSummary = buildSummary('audited_with_issues')

    await store.submitOwnerApproval('2026-01-29', { decision: 'needs_correction', notes: 'ต้องแก้ไข' })

    expect(store.currentSummary.workflowStatus).toBe('needs_correction')
    expect(store.currentSummary.needsCorrectionFrom).toBe('owner')
  })
})

// ─── Happy path: full state machine step1 → step2 → audited → approved ───────

describe('happy path: full workflow state machine', () => {
  it('transitions through all states from step1_in_progress to approved', async () => {
    const store = useBillPaymentStore()

    // 1. Start at step1_in_progress
    store.currentSummary = buildSummary('step1_in_progress')
    expect(store.getCurrentWorkflowStatus).toBe('step1_in_progress')

    // 2. Complete Step 1
    mockFetch.mockResolvedValue({
      data: buildSummary('step2_completed', { step1CompletedAt: '2026-01-29T11:00:00Z' }),
    })
    await store.completeStep1('2026-01-29')
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed')
    expect(store.isStep1Complete).toBe(true)

    // 3. Complete Step 2
    mockFetch.mockResolvedValue({
      data: buildSummary('step2_completed', {
        step1CompletedAt: '2026-01-29T11:00:00Z',
        step2CompletedAt: '2026-01-29T12:00:00Z',
      }),
    })
    await store.completeStep2('2026-01-29', { actualBillPaymentCash: 3200, actualServiceFeeCash: 40 })
    expect(store.isStep2Complete).toBe(true)

    // 4. Audit
    mockFetch.mockResolvedValue({
      data: buildSummary('audited', {
        step1CompletedAt: '2026-01-29T11:00:00Z',
        step2CompletedAt: '2026-01-29T12:00:00Z',
        auditedAt: '2026-01-29T14:00:00Z',
      }),
    })
    await store.submitAudit('2026-01-29', { outcome: 'audited' })
    expect(store.getCurrentWorkflowStatus).toBe('audited')
    expect(store.isAudited).toBe(true)

    // 5. Owner approval
    mockFetch.mockResolvedValue({
      data: buildSummary('approved', {
        step1CompletedAt: '2026-01-29T11:00:00Z',
        step2CompletedAt: '2026-01-29T12:00:00Z',
        auditedAt: '2026-01-29T14:00:00Z',
        approvedAt: '2026-01-29T17:00:00Z',
      }),
    })
    await store.submitOwnerApproval('2026-01-29', { decision: 'approved' })
    expect(store.getCurrentWorkflowStatus).toBe('approved')
    expect(store.isApproved).toBe(true)
  })
})

// ─── clearError ──────────────────────────────────────────────────────────────

describe('clearError', () => {
  it('resets error to null', () => {
    const store = useBillPaymentStore()
    store.error = 'Something went wrong'
    store.clearError()
    expect(store.error).toBeNull()
  })
})
