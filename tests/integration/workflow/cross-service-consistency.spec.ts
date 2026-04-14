/* eslint-disable */
// @ts-nocheck
/**
 * Cross-Service Consistency Tests
 *
 * After the service harmonization (Flow 2 + Flow 3), Money Transfer and
 * Bill Payment must use identical status models and store patterns.
 * These tests assert the contract that both services share.
 *
 * @see docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (sections 7, 9, 11)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  WORKFLOW_STATUS_MAP,
  TRANSACTION_STATUS_MAP,
  getWorkflowStatusConfig,
  getTransactionStatusConfig,
  type UnifiedWorkflowStatus,
  type UnifiedTransactionStatus,
} from '~/types/shared-workflow'

vi.stubGlobal('useAuthStore', () => ({ user: { uid: 'u1', displayName: 'U' } }))
vi.stubGlobal('useNuxtApp', () => ({ $apiFetch: null }))
vi.stubGlobal('$fetch', vi.fn(async () => ({ data: null, success: true })))

describe('Cross-Service Consistency', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Unified status models ────────────────────────────────────────────────
  describe('Unified status types', () => {
    it('covers all 9 unified workflow statuses', () => {
      const expected: UnifiedWorkflowStatus[] = [
        'step1_in_progress',
        'step1_completed',
        'step2_completed',
        'step2_completed_with_notes',
        'audited',
        'audited_with_issues',
        'approved',
        'approved_with_notes',
        'needs_correction',
      ]
      for (const status of expected) {
        expect(WORKFLOW_STATUS_MAP[status]).toBeDefined()
        expect(WORKFLOW_STATUS_MAP[status].label).toBeTruthy()
      }
      expect(Object.keys(WORKFLOW_STATUS_MAP).sort()).toEqual([...expected].sort())
    })

    it('covers all 4 unified transaction statuses', () => {
      const expected: UnifiedTransactionStatus[] = ['completed', 'draft', 'on_hold', 'cancelled']
      for (const status of expected) {
        expect(TRANSACTION_STATUS_MAP[status]).toBeDefined()
      }
      expect(Object.keys(TRANSACTION_STATUS_MAP).sort()).toEqual([...expected].sort())
    })

    it('does NOT include legacy aliases (success, failed) in transaction map', () => {
      // After Task 4.2, legacy aliases should be migrated to unified statuses
      expect((TRANSACTION_STATUS_MAP as any).success).toBeUndefined()
      expect((TRANSACTION_STATUS_MAP as any).failed).toBeUndefined()
    })

    it('returns safe defaults for unknown statuses', () => {
      const wf = getWorkflowStatusConfig('unknown_status' as any)
      expect(wf.label).toBe('unknown_status')
      expect(wf.badgeVariant).toBe('default')

      const tx = getTransactionStatusConfig('unknown_status' as any)
      expect(tx.label).toBe('unknown_status')
      expect(tx.badgeVariant).toBe('default')
    })
  })

  // ── Store API pattern parity ─────────────────────────────────────────────
  describe('Store API parity (Money Transfer vs Bill Payment)', () => {
    it('exposes matching action names on both stores', async () => {
      const mt = (await import('~/stores/money-transfer')).useMoneyTransferStore()
      const bp = (await import('~/stores/bill-payment')).useBillPaymentStore()

      const sharedActions = [
        'initializeStore',
        'fetchTransactionsByDate',
        'fetchDailySummary',
        'createTransaction',
        'updateTransaction',
        'completeStep1',
        'completeStep2',
        'submitAudit',
        'submitOwnerApproval',
        'completeDraftTransaction',
        'changeTransactionStatus',
        'fetchCurrentBalanceAction',
        'setOpeningBalance',
        'clearError',
      ]

      for (const action of sharedActions) {
        expect(typeof mt[action]).toBe('function')
        expect(typeof bp[action]).toBe('function')
      }
    })

    it('exposes matching getter/state names on both stores', async () => {
      const mt = (await import('~/stores/money-transfer')).useMoneyTransferStore()
      const bp = (await import('~/stores/bill-payment')).useBillPaymentStore()

      const sharedProps = [
        'transactions',
        'currentSummary',
        'currentBalance',
        'isLoading',
        'error',
        'getTransactionsByDate',
        'getDraftTransactions',
        'getOnHoldTransactions',
        'getCompletedTransactions',
        'getCurrentWorkflowStatus',
        'isStep1Complete',
        'isStep2Complete',
        'isAudited',
        'isApproved',
        'isOpeningBalanceSet',
      ]

      for (const prop of sharedProps) {
        expect(mt).toHaveProperty(prop)
        expect(bp).toHaveProperty(prop)
      }
    })

    it('both stores default getCurrentWorkflowStatus to step1_in_progress', async () => {
      const mt = (await import('~/stores/money-transfer')).useMoneyTransferStore()
      const bp = (await import('~/stores/bill-payment')).useBillPaymentStore()

      expect(mt.getCurrentWorkflowStatus).toBe('step1_in_progress')
      expect(bp.getCurrentWorkflowStatus).toBe('step1_in_progress')
    })

    it('both stores mark isApproved true for both approved and approved_with_notes', async () => {
      const mt = (await import('~/stores/money-transfer')).useMoneyTransferStore()
      const bp = (await import('~/stores/bill-payment')).useBillPaymentStore()

      // MT reads ownerApproval.status; BP reads workflowStatus — both should accept both values
      mt.currentSummary = { ownerApproval: { status: 'approved' } }
      expect(mt.isApproved).toBe(true)
      mt.currentSummary = { ownerApproval: { status: 'approved_with_notes' } }
      expect(mt.isApproved).toBe(true)
      mt.currentSummary = { ownerApproval: { status: 'audited' } }
      expect(mt.isApproved).toBe(false)

      bp.currentSummary = { workflowStatus: 'approved' }
      expect(bp.isApproved).toBe(true)
      bp.currentSummary = { workflowStatus: 'approved_with_notes' }
      expect(bp.isApproved).toBe(true)
      bp.currentSummary = { workflowStatus: 'audited' }
      expect(bp.isApproved).toBe(false)
    })
  })

  // ── Transaction status filter parity ─────────────────────────────────────
  describe('Transaction status filters behave identically', () => {
    it('filter by draft/on_hold/completed returns same shape on both stores', async () => {
      const mt = (await import('~/stores/money-transfer')).useMoneyTransferStore()
      const bp = (await import('~/stores/bill-payment')).useBillPaymentStore()

      const sample = [
        { id: 'x1', date: '2026-04-14', status: 'completed', amount: 100 },
        { id: 'x2', date: '2026-04-14', status: 'draft', amount: 200 },
        { id: 'x3', date: '2026-04-14', status: 'on_hold', amount: 300 },
        { id: 'x4', date: '2026-04-14', status: 'cancelled', amount: 400 },
      ]

      mt.transactions = sample.slice()
      bp.transactions = sample.slice()

      expect(mt.getDraftTransactions.length).toBe(1)
      expect(bp.getDraftTransactions.length).toBe(1)
      expect(mt.getOnHoldTransactions.length).toBe(1)
      expect(bp.getOnHoldTransactions.length).toBe(1)
      expect(mt.getCompletedTransactions.length).toBe(1)
      expect(bp.getCompletedTransactions.length).toBe(1)
    })
  })
})
