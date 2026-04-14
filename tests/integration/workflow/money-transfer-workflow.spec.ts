/* eslint-disable */
// @ts-nocheck
/**
 * Money Transfer — Workflow Integration Tests
 *
 * Validates full end-to-end workflow state transitions via the Pinia store,
 * with a simulated server backing store.
 *
 * Scenarios:
 *   1. Happy path:  step1_in_progress → step1_completed → step2_completed → audited → approved
 *   2. With notes:  step2_completed_with_notes → audited_with_issues → approved_with_notes
 *   3. Correction:  audited → needs_correction → step1_in_progress → ... → approved
 *   4. Draft flow:  create draft → complete draft → verify status
 *   5. Status change: completed → on_hold → completed / cancelled
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createServerState, createFetchMock } from './_helpers'

// ── Mocks for Nuxt auto-imports referenced by the store ──────────────────────
vi.stubGlobal('useAuthStore', () => ({
  user: { uid: 'test-user', displayName: 'Test User' },
}))

// We import the store *after* stubbing globals so defineStore has access.
async function loadStore() {
  const mod = await import('~/stores/money-transfer')
  return mod.useMoneyTransferStore()
}

describe('Money Transfer — Workflow Integration', () => {
  const date = '2026-04-14'
  let server: ReturnType<typeof createServerState>

  beforeEach(() => {
    setActivePinia(createPinia())
    server = createServerState()
  })

  // ── Scenario 1: Full happy path ───────────────────────────────────────────
  it('transitions through full happy path: step1 → step2 → audit → approve', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/money-transfer/transactions': (body, _p, url) => {
        if (url.includes('/api/money-transfer/transactions') && body?.amount != null) {
          const txn = { id: 't1', date, status: 'completed', ...body }
          server.transactions.push(txn)
          return txn
        }
        return server.transactions
      },
      '/api/money-transfer/balances/current': () => server.balance,
      '/api/money-transfer/balances/': () => server.balance,
      [`/api/money-transfer/summaries/${date}/complete-step1`]: () => {
        server.summary = {
          date,
          workflowStatus: 'step1_completed',
          step1: { status: 'completed' },
          step2: { status: 'pending' },
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/complete-step2`]: (body) => {
        const hasNotes = !!body?.notes
        server.summary = {
          ...server.summary,
          workflowStatus: hasNotes ? 'step2_completed_with_notes' : 'step2_completed',
          step2: { status: 'completed', ...body },
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/audit`]: (body) => {
        const outcome = body?.outcome ?? 'audited'
        const map = {
          audited: 'audited',
          audited_with_issues: 'audited_with_issues',
          needs_correction: 'needs_correction',
        }
        server.summary = {
          ...server.summary,
          workflowStatus: map[outcome] ?? 'audited',
          auditorVerification: { status: outcome === 'needs_correction' ? 'rejected' : 'completed' },
        }
        if (outcome === 'needs_correction') {
          server.summary.step2 = { status: 'pending' }
          server.summary.workflowStatus = 'needs_correction'
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/approve`]: (body) => {
        const decision = body?.decision ?? 'approved'
        server.summary = {
          ...server.summary,
          workflowStatus: decision,
          ownerApproval: { status: decision },
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}`]: () => server.summary,
    }))

    const store = await loadStore()

    // Step 1: record a transaction then complete step 1
    await store.createTransaction({ date, amount: 500, commission: 10, transactionType: 'transfer' })
    expect(store.transactions.length).toBe(1)

    await store.completeStep1(date)
    expect(store.getCurrentWorkflowStatus).toBe('step1_completed')
    expect(store.isStep1Complete).toBe(true)

    // Step 2: verify cash count
    await store.completeStep2(date, { actualAmount: 500 })
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed')
    expect(store.isStep2Complete).toBe(true)

    // Audit
    await store.submitAudit(date, { outcome: 'audited' })
    expect(store.getCurrentWorkflowStatus).toBe('audited')
    expect(store.isAudited).toBe(true)

    // Owner approval
    await store.submitOwnerApproval(date, { decision: 'approved' })
    expect(store.getCurrentWorkflowStatus).toBe('approved')
    expect(store.isApproved).toBe(true)
  })

  // ── Scenario 2: With notes path ───────────────────────────────────────────
  it('follows with-notes path: step2_completed_with_notes → audited_with_issues → approved_with_notes', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/money-transfer/transactions': () => server.transactions,
      '/api/money-transfer/balances/current': () => server.balance,
      '/api/money-transfer/balances/': () => server.balance,
      [`/api/money-transfer/summaries/${date}/complete-step1`]: () => {
        server.summary = { date, workflowStatus: 'step1_completed', step1: { status: 'completed' } }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/complete-step2`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.notes ? 'step2_completed_with_notes' : 'step2_completed',
          step2: { status: 'completed', notes: body?.notes },
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/audit`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.outcome,
          auditorVerification: { status: 'completed' },
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/approve`]: (body) => {
        server.summary = {
          ...server.summary,
          workflowStatus: body?.decision,
          ownerApproval: { status: body?.decision },
        }
        return server.summary
      },
    }))

    const store = await loadStore()

    await store.completeStep1(date)
    await store.completeStep2(date, { notes: 'Cash short by 50 baht' })
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed_with_notes')

    await store.submitAudit(date, { outcome: 'audited_with_issues' })
    expect(store.getCurrentWorkflowStatus).toBe('audited_with_issues')

    await store.submitOwnerApproval(date, { decision: 'approved_with_notes' })
    expect(store.getCurrentWorkflowStatus).toBe('approved_with_notes')
    expect(store.isApproved).toBe(true) // also returns true for approved_with_notes
  })

  // ── Scenario 3: Correction path ───────────────────────────────────────────
  it('handles correction loop: audit rejects → needs_correction → re-submit → approved', async () => {
    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/money-transfer/transactions': () => server.transactions,
      '/api/money-transfer/balances/current': () => server.balance,
      '/api/money-transfer/balances/': () => server.balance,
      [`/api/money-transfer/summaries/${date}/complete-step1`]: () => {
        server.summary = { date, workflowStatus: 'step1_completed', step1: { status: 'completed' } }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/complete-step2`]: () => {
        server.summary = { ...server.summary, workflowStatus: 'step2_completed', step2: { status: 'completed' } }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/audit`]: (body) => {
        if (body?.outcome === 'needs_correction') {
          server.summary = {
            ...server.summary,
            workflowStatus: 'needs_correction',
            step2: { status: 'pending' },
          }
        } else {
          server.summary = {
            ...server.summary,
            workflowStatus: 'audited',
            auditorVerification: { status: 'completed' },
          }
        }
        return server.summary
      },
      [`/api/money-transfer/summaries/${date}/approve`]: () => {
        server.summary = { ...server.summary, workflowStatus: 'approved', ownerApproval: { status: 'approved' } }
        return server.summary
      },
    }))

    const store = await loadStore()

    await store.completeStep1(date)
    await store.completeStep2(date, {})
    await store.submitAudit(date, { outcome: 'needs_correction', notes: 'Recount required' })

    expect(store.getCurrentWorkflowStatus).toBe('needs_correction')
    // Manager should re-verify Step 2 — isStep2Complete goes back to false
    expect(store.isStep2Complete).toBe(false)

    // Re-submit after correction
    await store.completeStep2(date, { notes: 'Recounted' })
    expect(store.getCurrentWorkflowStatus).toBe('step2_completed')

    await store.submitAudit(date, { outcome: 'audited' })
    await store.submitOwnerApproval(date, { decision: 'approved' })
    expect(store.getCurrentWorkflowStatus).toBe('approved')
  })

  // ── Scenario 4: Draft transaction flow ────────────────────────────────────
  it('handles draft transaction flow: create draft → complete draft', async () => {
    server.transactions = []

    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/money-transfer/transactions/t1/complete': () => {
        const idx = server.transactions.findIndex((x) => x.id === 't1')
        const updated = { ...server.transactions[idx], status: 'completed' }
        server.transactions[idx] = updated
        return updated
      },
      '/api/money-transfer/transactions': (body) => {
        if (body?.amount != null) {
          const txn = { id: 't1', date, status: body.status ?? 'draft', ...body }
          server.transactions.push(txn)
          return txn
        }
        return server.transactions
      },
      '/api/money-transfer/balances/current': () => server.balance,
      '/api/money-transfer/balances/': () => server.balance,
    }))

    const store = await loadStore()

    const draft = await store.createTransaction({
      date,
      amount: 500,
      status: 'draft',
      transactionType: 'transfer',
    })
    expect(draft.status).toBe('draft')
    expect(store.getDraftTransactions.length).toBe(1)
    expect(store.hasDrafts).toBe(true)

    await store.completeDraftTransaction('t1')
    expect(store.getDraftTransactions.length).toBe(0)
    expect(store.getCompletedTransactions.length).toBe(1)
    expect(store.hasDrafts).toBe(false)
  })

  // ── Scenario 5: Status change (completed ↔ on_hold, → cancelled) ──────────
  it('handles transaction status changes: completed → on_hold → cancelled', async () => {
    server.transactions = [
      { id: 't1', date, status: 'completed', amount: 500, transactionType: 'transfer' },
    ]

    vi.stubGlobal('$fetch', createFetchMock(server, {
      '/api/money-transfer/transactions/t1/status': (body) => {
        const idx = server.transactions.findIndex((x) => x.id === 't1')
        const updated = { ...server.transactions[idx], status: body.status, statusNote: body.statusNote }
        server.transactions[idx] = updated
        return updated
      },
      '/api/money-transfer/transactions': () => server.transactions,
      '/api/money-transfer/balances/': () => server.balance,
    }))

    const store = await loadStore()
    store.transactions = server.transactions.slice()

    await store.changeTransactionStatus('t1', 'on_hold', 'Customer issue')
    expect(store.getOnHoldTransactions.length).toBe(1)
    expect(store.transactions[0].statusNote).toBe('Customer issue')

    await store.changeTransactionStatus('t1', 'cancelled', 'Not recoverable')
    expect(store.transactions[0].status).toBe('cancelled')
    expect(store.getOnHoldTransactions.length).toBe(0)
  })
})
