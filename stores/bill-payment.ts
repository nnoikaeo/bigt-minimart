/* eslint-disable */
// @ts-nocheck
/**
 * TODO: Fix Pinia TypeScript type inference
 * - Nuxt typecheck cannot resolve pinia module
 * - Store state properties not recognized by TypeScript
 * - These are pre-existing issues in the codebase
 */

import { defineStore } from 'pinia'
import type {
  BillPaymentTransaction,
  BillPaymentDailySummary,
  BillPaymentBalance,
} from '~/types/bill-payment'

/**
 * Bill Payment Service Store
 *
 * Manages all bill payment transaction state and operations.
 * Mirrors money-transfer store architecture with a 3-balance model:
 *   - bankAccount: store's bank account
 *   - billPaymentCash: cash received from bill payments
 *   - serviceFeeCash: commission cash collected
 *
 * Balance rules:
 *   bill_payment success: bankAccount -= amount, billPaymentCash += amount, serviceFeeCash += commission
 *   owner_deposit success: bankAccount += amount
 *   failed status: no balance change
 *
 * Phase 1: API calls to jsonRepository endpoints
 * Phase 2: API calls to firestoreRepository endpoints (no client code changes)
 */
export const useBillPaymentStore = defineStore('billPayment', {
  state: () => ({
    /**
     * All bill payment transactions for the currently selected date
     */
    transactions: [] as BillPaymentTransaction[],

    /**
     * All daily summaries (loaded for History page)
     */
    summaries: [] as BillPaymentDailySummary[],

    /**
     * Summary for the currently selected date
     */
    currentSummary: null as BillPaymentDailySummary | null,

    /**
     * Balance for the currently selected date
     */
    currentBalance: null as BillPaymentBalance | null,

    /**
     * Loading and error state
     */
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    /**
     * Transactions for a specific date
     */
    getTransactionsByDate: (state: any) => (date: string) => {
      return state.transactions.filter((t: any) => t.date === date)
    },

    /**
     * "Draft" transactions — those editable before Step 1 completion.
     * In bill-payment, all currently-loaded transactions are editable
     * while the workflow is still in step1_in_progress or needs_correction.
     */
    getDraftTransactions: (state: any) => {
      const editableStatuses = ['step1_in_progress', 'needs_correction']
      if (!editableStatuses.includes(state.currentSummary?.workflowStatus)) return []
      return state.transactions
    },

    /**
     * Check if Step 1 is complete (manager has finished recording)
     */
    isStep1Complete: (state: any) => {
      return !!state.currentSummary?.step1CompletedAt
    },

    /**
     * Check if Step 2 is complete (manager has verified cash count)
     */
    isStep2Complete: (state: any) => {
      return !!state.currentSummary?.step2CompletedAt
    },

    /**
     * Check if audited (Workflow 3.2 complete)
     */
    isAudited: (state: any) => {
      return !!state.currentSummary?.auditedAt
    },

    /**
     * Check if approved (Workflow 3.3 complete)
     */
    isApproved: (state: any) => {
      return (
        state.currentSummary?.workflowStatus === 'approved' ||
        state.currentSummary?.workflowStatus === 'approved_with_notes'
      )
    },

    /**
     * Current workflow status (defaults to step1_in_progress if no summary yet)
     */
    getCurrentWorkflowStatus: (state: any) => {
      return state.currentSummary?.workflowStatus || 'step1_in_progress'
    },
  },

  actions: {
    /**
     * Initialize store: Load today's data
     */
    async initializeStore(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const today = new Date().toISOString().split('T')[0]
        await this.fetchTransactionsByDate(today)
        await this.fetchCurrentBalanceAction()
        await this.fetchDailySummary(today)
      } catch (error: any) {
        this.error = `Failed to initialize store: ${error.message}`
        console.error('[billPayment/initializeStore]', error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch transactions for a specific date
     */
    async fetchTransactionsByDate(date: string): Promise<void> {
      this.isLoading = true

      try {
        const response = await $fetch('/api/bill-payment/transactions', { params: { date } })
        this.transactions = response.data || []
        console.log(`[billPayment/fetchTransactionsByDate] ${this.transactions.length} txns for ${date}`)
      } catch (error: any) {
        this.error = `Failed to fetch transactions: ${error.message}`
        console.error('[billPayment/fetchTransactionsByDate]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch daily summary for a date
     */
    async fetchDailySummary(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/bill-payment/summaries/${date}`)
        this.currentSummary = response.data
        console.log('[billPayment/fetchDailySummary] Fetched summary for', date)
      } catch {
        // Summary doesn't exist yet — that's OK for new dates
        this.currentSummary = null
      }
    },

    /**
     * Fetch all daily summaries (for History page)
     */
    async fetchAllSummaries(): Promise<void> {
      try {
        const response = await $fetch('/api/bill-payment/summaries')
        this.summaries = response.data || []
      } catch (error: any) {
        this.error = `Failed to fetch summaries: ${error.message}`
        throw error
      }
    },

    /**
     * Initialize summary for a date (idempotent — safe to call on page load)
     */
    async initDailySummary(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/bill-payment/summaries/${date}/init`, { method: 'POST' })
        this.currentSummary = response.data
        console.log('[billPayment/initDailySummary]', response.created ? 'Created' : 'Already exists', date)
      } catch (error: any) {
        console.error('[billPayment/initDailySummary]', error.message)
      }
    },

    /**
     * Create a new transaction
     */
    async createTransaction(transactionData: any): Promise<BillPaymentTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch('/api/bill-payment/transactions', {
          method: 'POST',
          body: transactionData,
        })

        const newTxn = response.data
        this.transactions.push(newTxn)

        // Refresh balance after balance-affecting transaction
        await this.fetchBalanceByDate(transactionData.date)

        console.log('[billPayment/createTransaction] Created:', newTxn.id)
        return newTxn
      } catch (error: any) {
        this.error = `Failed to create transaction: ${error.message}`
        console.error('[billPayment/createTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update an existing transaction
     */
    async updateTransaction(
      id: string,
      updates: Partial<BillPaymentTransaction>
    ): Promise<BillPaymentTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/bill-payment/transactions/${id}`, {
          method: 'PUT',
          body: updates,
        })

        const updated = response.data
        const index = this.transactions.findIndex((t: any) => t.id === id)
        if (index !== -1) this.transactions[index] = updated

        if (updated.date) await this.fetchBalanceByDate(updated.date)

        console.log('[billPayment/updateTransaction] Updated:', id)
        return updated
      } catch (error: any) {
        this.error = `Failed to update transaction: ${error.message}`
        console.error('[billPayment/updateTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete a transaction (only valid before Step 1 completion)
     */
    async deleteDraftTransaction(id: string): Promise<void> {
      this.isLoading = true

      try {
        const txn = this.transactions.find((t: any) => t.id === id)
        const date = txn?.date

        await $fetch(`/api/bill-payment/transactions/${id}`, { method: 'DELETE' })

        this.transactions = this.transactions.filter((t: any) => t.id !== id)

        if (date) await this.fetchBalanceByDate(date)

        console.log('[billPayment/deleteDraftTransaction] Deleted:', id)
      } catch (error: any) {
        this.error = `Failed to delete transaction: ${error.message}`
        console.error('[billPayment/deleteDraftTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch current balance for today
     */
    async fetchCurrentBalanceAction(): Promise<void> {
      try {
        const response = await $fetch('/api/bill-payment/balances/current')
        this.currentBalance = response.data
        console.log('[billPayment/fetchCurrentBalanceAction]', this.currentBalance)
      } catch (error: any) {
        this.error = `Failed to fetch balance: ${error.message}`
        console.error('[billPayment/fetchCurrentBalanceAction]', error)
        throw error
      }
    },

    /**
     * Fetch balance for a specific date
     */
    async fetchBalanceByDate(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/bill-payment/balances/${date}`)
        this.currentBalance = response.data
        console.log('[billPayment/fetchBalanceByDate]', date, this.currentBalance)
      } catch (error: any) {
        this.error = `Failed to fetch balance for ${date}: ${error.message}`
        console.error('[billPayment/fetchBalanceByDate]', error)
      }
    },

    /**
     * Set opening balance for a date
     */
    async setOpeningBalance(
      date: string,
      amount: number,
      source: 'carryover' | 'manual',
      userId?: string
    ): Promise<void> {
      try {
        const response = await $fetch('/api/bill-payment/balances/opening', {
          method: 'POST',
          body: { date, amount, source, userId },
        })
        this.currentBalance = response.data
        console.log('[billPayment/setOpeningBalance]', amount, source)
      } catch (error: any) {
        this.error = `Failed to set opening balance: ${error.message}`
        console.error('[billPayment/setOpeningBalance]', error)
        throw error
      }
    },

    /**
     * Complete Step 1: Manager finishes recording transactions
     * WF 3.1 — transitions to Step 2
     */
    async completeStep1(date: string): Promise<BillPaymentDailySummary> {
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        const response = await $fetch(`/api/bill-payment/summaries/${date}/complete-step1`, {
          method: 'POST',
          body: {
            userId: authStore.user?.uid || 'system',
            userName: authStore.user?.displayName || 'Manager',
          },
        })

        this.currentSummary = response.data
        console.log('[billPayment/completeStep1] Done for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to complete Step 1: ${error.message}`
        console.error('[billPayment/completeStep1]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Complete Step 2: Manager verifies cash count
     * WF 3.1 — transitions to auditor review
     */
    async completeStep2(date: string, step2Data: any): Promise<BillPaymentDailySummary> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/bill-payment/summaries/${date}/complete-step2`, {
          method: 'POST',
          body: step2Data,
        })

        this.currentSummary = response.data
        console.log('[billPayment/completeStep2] Done for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to complete Step 2: ${error.message}`
        console.error('[billPayment/completeStep2]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Submit audit (WF 3.2)
     * outcome: 'audited' | 'audited_with_issues' | 'needs_correction'
     *
     * needs_correction uses Approach C:
     *   - clears Step 2 verification (Manager must re-verify)
     *   - preserves Step 1 transaction records
     *   - workflowStatus → 'needs_correction'
     */
    async submitAudit(date: string, auditData: any): Promise<BillPaymentDailySummary> {
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        const response = await $fetch(`/api/bill-payment/summaries/${date}/audit`, {
          method: 'POST',
          body: {
            ...auditData,
            auditedBy: authStore.user?.uid || 'auditor',
            auditedByName: authStore.user?.displayName || 'Auditor',
          },
        })

        this.currentSummary = response.data
        console.log('[billPayment/submitAudit] Done for', date, '→', this.currentSummary?.workflowStatus)
        return response.data
      } catch (error: any) {
        this.error = `Failed to submit audit: ${error.message}`
        console.error('[billPayment/submitAudit]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Submit owner approval (WF 3.3)
     * decision: 'approved' | 'approved_with_notes' | 'needs_correction'
     */
    async submitOwnerApproval(date: string, approvalData: any): Promise<BillPaymentDailySummary> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/bill-payment/summaries/${date}/approve`, {
          method: 'POST',
          body: approvalData,
        })

        this.currentSummary = response.data
        console.log('[billPayment/submitOwnerApproval] Done for', date, '→', this.currentSummary?.workflowStatus)
        return response.data
      } catch (error: any) {
        this.error = `Failed to submit approval: ${error.message}`
        console.error('[billPayment/submitOwnerApproval]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Clear error message
     */
    clearError(): void {
      this.error = null
    },
  },
})
