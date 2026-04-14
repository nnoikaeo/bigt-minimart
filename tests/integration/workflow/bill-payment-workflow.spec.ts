/* eslint-disable */
// @ts-nocheck
/**
 * Bill Payment — Workflow Integration Tests
 *
 * Validates full end-to-end workflow state transitions via the Pinia store,
 * with a simulated server backing store.
 *
 * Scenarios:
 *   1. Happy path:  step1_in_progress → step1_completed → step2_completed → audited → approved
 *   2. With notes:  step2_completed_with_notes → audited_with_issues → approved_with_notes
 *   3. Correction:  audited → needs_correction → step1_in_progress → ... → approved
 *   4. Draft flow:  create draft → complete draft
 *   5. Opening balance: carryover + manual
 *   6. Auto commission calculation (completed transactions only)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createServerState, createFetchMock } from './_helpers'

// Bill payment store uses `getApiFetch()` → falls back to $fetch when process.client is falsy.
vi.stubGlobal('useNuxtApp', () => ({ $apiFetch: null }))

async function loadStore() {
  const mod = await import('~/stores/bill-payment')
  return mod.useBillPaymentStore()
}

describe('Bill Payment — Workflow Integration', () => {
  const date = '2026-04-14'
  let server: ReturnType<typeof createServerState>

  beforeEach(() => {
    setActivePinia(createPinia())
    server = createServerState()
  })

  // ── Scenario 1: Full happy path ───────────────────────────────────────────
  it('transitions through full happy path: step1 → step2 → audit → approve', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/transactions': (body, _p, url) => {
        if (url.includes('/api/bill-payment/transactions') && body?.amount != null) {
          const txn = { id: 'b1', date, status: 'completed', commission: 10, ...body }
          server.transactions.push(txn)
          return txn
        }
        return server.transactions
      },
      '/api/bill-payment/balances/current': () => server.balance,
      '/api/bill-payment/balances/': () => server.balance,
      [`/api/bill-payment/summaries/${date}/complete-step1`]: () => {
        server.summary = {
          date,
          workflowStatus: 'step1_completed',
          step1CompletedAt: new Date().toISOString(),
        }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/complete-step2`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.notes ? 'step2_completed_with_notes' : 'step2_completed',
          step2CompletedAt: new Date().toISOString(),
        }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/audit`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.outcome ?? 'audited',
          auditedAt: new Date().toISOString(),
        }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/approve`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.decision ?? 'approved',
        }
        return server.summary
      },
    }))

    const store = await loadStore()

    await store.createTransaction({
      date,
      amount: 300,
      commission: 10,
      transactionType: 'bill_payment',
    })
    expect(store.transactions.length).toBe(1)

    await store.completeStep1(date)
    expect(store.getCurrentWorkflowStatus).toBe('step1_completed')
    expect(store.isStep1Complete).toBe(true)

    await store.completeStep2(date, { actualAmount: 300 })
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed')
    expect(store.isStep2Complete).toBe(true)

    await store.submitAudit(date, { outcome: 'audited' })
    expect(store.getCurrentWorkflowStatus).toBe('audited')
    expect(store.isAudited).toBe(true)

    await store.submitOwnerApproval(date, { decision: 'approved' })
    expect(store.getCurrentWorkflowStatus).toBe('approved')
    expect(store.isApproved).toBe(true)
  })

  // ── Scenario 2: With notes path ───────────────────────────────────────────
  it('follows with-notes path with 3rd auditor outcome: audited_with_issues', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/balances/': () => server.balance,
      [`/api/bill-payment/summaries/${date}/complete-step1`]: () => {
        server.summary = { date, workflowStatus: 'step1_completed', step1CompletedAt: 'now' }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/complete-step2`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.notes ? 'step2_completed_with_notes' : 'step2_completed',
          step2CompletedAt: 'now',
        }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/audit`]: (body) => {
        server.summary = { ...server.summary, workflowStatus: body?.outcome, auditedAt: 'now' }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/approve`]: (body) => {
        server.summary = { ...server.summary, workflowStatus: body?.decision }
        return server.summary
      },
    }))

    const store = await loadStore()

    await store.completeStep1(date)
    await store.completeStep2(date, { notes: 'Cash 20 baht short' })
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed_with_notes')

    await store.submitAudit(date, { outcome: 'audited_with_issues' })
    expect(store.getCurrentWorkflowStatus).toBe('audited_with_issues')

    await store.submitOwnerApproval(date, { decision: 'approved_with_notes' })
    expect(store.getCurrentWorkflowStatus).toBe('approved_with_notes')
    expect(store.isApproved).toBe(true)
  })

  // ── Scenario 3: Correction loop (Approach C — clears Step 2 only) ─────────
  it('handles correction loop: audit → needs_correction → re-verify → approved', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/balances/': () => server.balance,
      [`/api/bill-payment/summaries/${date}/complete-step1`]: () => {
        server.summary = { date, workflowStatus: 'step1_completed', step1CompletedAt: 'now' }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/complete-step2`]: () => {
        server.summary = { ...server.summary, workflowStatus: 'step2_completed', step2CompletedAt: 'now' }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/audit`]: (body) => {
        if (body?.outcome === 'needs_correction') {
          server.summary = {
            ...server.summary,
            workflowStatus: 'needs_correction',
            step2CompletedAt: null, // Approach C: clear Step 2 verification
          }
        } else {
          server.summary = { ...server.summary, workflowStatus: 'audited', auditedAt: 'now' }
        }
        return server.summary
      },
      [`/api/bill-payment/summaries/${date}/approve`]: () => {
        server.summary = { ...server.summary, workflowStatus: 'approved' }
        return server.summary
      },
    }))

    const store = await loadStore()

    await store.completeStep1(date)
    await store.completeStep2(date, {})
    await store.submitAudit(date, { outcome: 'needs_correction', notes: 'Please recount' })

    expect(store.getCurrentWorkflowStatus).toBe('needs_correction')
    // Step 1 records are preserved, but Step 2 must be re-done
    expect(store.isStep1Complete).toBe(true)
    expect(store.isStep2Complete).toBe(false)

    // Manager re-verifies
    await store.completeStep2(date, {})
    await store.submitAudit(date, { outcome: 'audited' })
    await store.submitOwnerApproval(date, { decision: 'approved' })
    expect(store.getCurrentWorkflowStatus).toBe('approved')
  })

  // ── Scenario 4: Draft transaction flow ────────────────────────────────────
  it('handles draft transaction flow: create draft → complete draft', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/transactions/b1/complete': () => {
        const idx = server.transactions.findIndex((x) => x.id === 'b1')
        const updated = { ...server.transactions[idx], status: 'completed' }
        server.transactions[idx] = updated
        return updated
      },
      '/api/bill-payment/transactions': (body) => {
        if (body?.amount != null) {
          const txn = { id: 'b1', date, status: body.status ?? 'draft', ...body }
          server.transactions.push(txn)
          return txn
        }
        return server.transactions
      },
      '/api/bill-payment/balances/': () => server.balance,
    }))

    const store = await loadStore()

    const draft = await store.createTransaction({
      date,
      amount: 300,
      status: 'draft',
      draftReason: 'Awaiting customer confirmation',
      transactionType: 'bill_payment',
    })
    expect(draft.status).toBe('draft')
    expect(store.getDraftTransactions.length).toBe(1)

    await store.completeDraftTransaction('b1')
    expect(store.getDraftTransactions.length).toBe(0)
    expect(store.getCompletedTransactions.length).toBe(1)
  })

  // ── Scenario 5: Opening balance (carryover + manual) ──────────────────────
  it('sets opening balance from both carryover and manual sources', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/balances/opening': (body) => {
        server.balance = {
          ...server.balance,
          bankAccount: body.amount,
          openingBalanceSource: body.source,
        }
        return server.balance
      },
      '/api/bill-payment/balances/': () => server.balance,
    }))

    const store = await loadStore()

    // Case 1: carryover from previous day
    await store.setOpeningBalance(date, 5000, 'carryover', 'user1')
    expect(store.currentBalance.bankAccount).toBe(5000)
    expect(store.currentBalance.openingBalanceSource).toBe('carryover')
    expect(store.isOpeningBalanceSet).toBe(true)

    // Case 2: manual override
    await store.setOpeningBalance(date, 7500, 'manual', 'user1')
    expect(store.currentBalance.bankAccount).toBe(7500)
    expect(store.currentBalance.openingBalanceSource).toBe('manual')
  })

  // ── Scenario 6: Auto commission calculation ───────────────────────────────
  it('aggregates total commission only from completed bill_payment transactions', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/transactions': () => server.transactions,
      '/api/bill-payment/balances/': () => server.balance,
    }))

    const store = await loadStore()
    store.transactions = [
      { id: 'b1', date, status: 'completed', transactionType: 'bill_payment', amount: 100, commission: 10 },
      { id: 'b2', date, status: 'completed', transactionType: 'bill_payment', amount: 200, commission: 15 },
      { id: 'b3', date, status: 'draft',     transactionType: 'bill_payment', amount: 300, commission: 20 },
      { id: 'b4', date, status: 'cancelled', transactionType: 'bill_payment', amount: 400, commission: 25 },
      { id: 'b5', date, status: 'completed', transactionType: 'owner_deposit', amount: 500, commission: 0 },
    ]

    // Only b1 (10) + b2 (15) count — draft/cancelled/non-bill-payment excluded
    expect(store.totalCommission).toBe(25)
    expect(store.successCount).toBe(3) // b1, b2, b5
    expect(store.getCompletedTransactions.length).toBe(3)
  })

  // ── Scenario 7: Status change (unified status model) ──────────────────────
  it('handles unified transaction status changes: completed → on_hold → cancelled', async () => {
    server.transactions = [
      { id: 'b1', date, status: 'completed', amount: 300, commission: 10, transactionType: 'bill_payment' },
    ]

    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/bill-payment/transactions/b1/status': (body) => {
        const idx = server.transactions.findIndex((x) => x.id === 'b1')
        const updated = { ...server.transactions[idx], status: body.status, statusNote: body.statusNote }
        server.transactions[idx] = updated
        return updated
      },
      '/api/bill-payment/balances/': () => server.balance,
    }))

    const store = await loadStore()
    store.transactions = server.transactions.slice()

    await store.changeTransactionStatus('b1', 'on_hold', 'Cash short')
    expect(store.getOnHoldTransactions.length).toBe(1)
    expect(store.transactions[0].statusNote).toBe('Cash short')

    await store.changeTransactionStatus('b1', 'cancelled', 'Unrecoverable')
    expect(store.transactions[0].status).toBe('cancelled')
    expect(store.getOnHoldTransactions.length).toBe(0)
    expect(store.getCompletedTransactions.length).toBe(0)
  })
})
