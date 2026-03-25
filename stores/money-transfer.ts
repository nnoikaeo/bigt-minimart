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
  MoneyTransferTransaction,
  MoneyTransferDailySummary,
  MoneyTransferBalance,
  FavoriteTransfer,
} from '~/types/repositories'

/**
 * Money Transfer Service Store
 *
 * Manages all money transfer transaction state and operations
 * Uses Repository Pattern via API endpoints for flexible data source switching
 *
 * Phase 1: API calls to jsonRepository endpoints
 * Phase 2: API calls to firestoreRepository endpoints (no client code changes)
 */
export const useMoneyTransferStore = defineStore('moneyTransfer', {
  state: () => ({
    /**
     * Array of all money transfer transactions
     */
    transactions: [] as MoneyTransferTransaction[],

    /**
     * Currently selected transaction
     */
    selectedTransaction: null as MoneyTransferTransaction | null,

    /**
     * Daily summaries (one per day with workflow status)
     */
    summaries: [] as MoneyTransferDailySummary[],

    /**
     * Current summary for today
     */
    currentSummary: null as MoneyTransferDailySummary | null,

    /**
     * Current balance for today
     */
    currentBalance: null as MoneyTransferBalance | null,

    /**
     * Previous day balance (used for carry-over opening balance)
     */
    previousDayBalance: null as MoneyTransferBalance | null,

    /**
     * Filter state
     */
    filters: {
      date: '',
      startDate: '',
      endDate: '',
      status: '' as '' | 'draft' | 'completed' | 'on_hold' | 'cancelled',
      transactionType: '' as '' | 'transfer' | 'withdrawal' | 'owner_deposit',
    },

    /**
     * Loading and error states
     */
    isLoading: false,
    error: null as string | null,

    /**
     * Draft transaction state
     */
    hasDrafts: false,
    draftCount: 0,

    /**
     * Favorite transfers (5 tabs × up to 10 items each)
     */
    favorites: [] as FavoriteTransfer[],
  }),

  getters: {
    /**
     * Get all transactions
     */
    getAllTransactions: (state: any) => state.transactions,

    /**
     * Get transactions for a specific date
     */
    getTransactionsByDate: (state: any) => (date: string) => {
      return state.transactions.filter((t: any) => t.date === date)
    },

    /**
     * Get completed transactions
     */
    getCompletedTransactions: (state: any) => {
      return state.transactions.filter((t: any) => t.status === 'completed')
    },

    /**
     * Get draft transactions
     */
    getDraftTransactions: (state: any) => {
      return state.transactions.filter((t: any) => t.status === 'draft')
    },

    /**
     * Get on-hold transactions
     */
    getOnHoldTransactions: (state: any) => {
      return state.transactions.filter((t: any) => t.status === 'on_hold')
    },

    /**
     * Get today's transaction statistics
     */
    getTodayStats: (state: any) => {
      const today = new Date().toISOString().split('T')[0]
      const todayTxns = state.transactions.filter((t: any) => t.date === today)

      return {
        total: todayTxns.length,
        completed: todayTxns.filter((t: any) => t.status === 'completed').length,
        drafts: todayTxns.filter((t: any) => t.status === 'draft').length,
        onHold: todayTxns.filter((t: any) => t.status === 'on_hold').length,
        totalAmount: todayTxns
          .filter((t: any) => t.status === 'completed')
          .reduce((sum: any, t: any) => sum + t.amount, 0),
        totalCommission: todayTxns
          .filter((t: any) => t.status === 'completed')
          .reduce((sum: any, t: any) => sum + (t.commission || 0), 0),
      }
    },

    /**
     * Get transactions for a specific date (computed)
     */
    getDateTransactions: (state: any) => (date: string) => {
      return state.transactions.filter((t: any) => t.date === date)
    },

    /**
     * Check if transaction can be processed (balance sufficiency)
     */
    canProcessTransaction: (state: any) => (amount: number) => {
      if (!state.currentBalance) return false
      return state.currentBalance.bankAccount >= amount
    },

    /**
     * Get shortfall amount for a transaction
     */
    getShortfall: (state: any) => (amount: number) => {
      if (!state.currentBalance) return amount
      return Math.max(0, amount - state.currentBalance.bankAccount)
    },

    /**
     * Get current workflow status
     */
    getCurrentWorkflowStatus: (state: any) => {
      return state.currentSummary?.workflowStatus || 'step1_in_progress'
    },

    /**
     * Check if Step 1 is complete
     */
    isStep1Complete: (state: any) => {
      return state.currentSummary?.step1?.status === 'completed'
    },

    /**
     * Check if Step 2 is complete
     */
    isStep2Complete: (state: any) => {
      return state.currentSummary?.step2?.status === 'completed'
    },

    /**
     * Check if audited (Workflow 2.2 complete)
     */
    isAudited: (state: any) => {
      return state.currentSummary?.auditorVerification?.status === 'completed'
    },

    /**
     * Check if approved (Workflow 2.3 complete)
     */
    isApproved: (state: any) => {
      return (
        state.currentSummary?.ownerApproval?.status === 'approved' ||
        state.currentSummary?.ownerApproval?.status === 'approved_with_notes'
      )
    },

    /**
     * Get loading state
     */
    getIsLoading: (state: any) => state.isLoading,

    /**
     * Get error state
     */
    getError: (state: any) => state.error,

    /**
     * Get selected transaction
     */
    getSelectedTransaction: (state: any) => state.selectedTransaction,

    /**
     * Get current balance
     */
    getCurrentBalance: (state: any) => state.currentBalance,

    /**
     * Get current summary
     */
    getCurrentSummary: (state: any) => state.currentSummary,

    /**
     * Check if opening balance has been set for today
     */
    isOpeningBalanceSet: (state: any) => state.currentBalance?.openingBalanceSource != null,

    /**
     * Get favorites filtered by tab, sorted by order
     */
    getFavoritesByTab: (state: any) => (tab: 1 | 2 | 3 | 4 | 5) => {
      return (state.favorites as FavoriteTransfer[])
        .filter(f => f.tab === tab)
        .sort((a, b) => a.order - b.order)
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
        await this.loadFavorites()
      } catch (error: any) {
        this.error = `Failed to initialize store: ${error.message}`
        console.error('[initializeStore]', error)
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
        const response = await $fetch(`/api/money-transfer/transactions`, {
          params: { date },
        })

        this.transactions = response.data || []
        this.draftCount = this.transactions.filter((t: any) => t.status === 'draft').length
        this.hasDrafts = this.draftCount > 0

        console.log(
          `[fetchTransactionsByDate] Fetched ${this.transactions.length} transactions for ${date}`
        )
      } catch (error: any) {
        this.error = `Failed to fetch transactions: ${error.message}`
        console.error('[fetchTransactionsByDate]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create new transaction
     */
    async createTransaction(transactionData: any): Promise<MoneyTransferTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch('/api/money-transfer/transactions', {
          method: 'POST',
          body: transactionData,
        })

        const newTransaction = response.data
        this.transactions.push(newTransaction)

        // Update draft count
        if (newTransaction.status === 'draft') {
          this.draftCount++
          this.hasDrafts = true
        }

        // Refresh balance for the transaction's date (not always today)
        await this.fetchBalanceByDate(transactionData.date)

        console.log('[createTransaction] Created transaction:', newTransaction.id)
        return newTransaction
      } catch (error: any) {
        this.error = `Failed to create transaction: ${error.message}`
        console.error('[createTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update existing transaction
     */
    async updateTransaction(
      id: string,
      updates: Partial<MoneyTransferTransaction>
    ): Promise<MoneyTransferTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/money-transfer/transactions/${id}`, {
          method: 'PUT',
          body: updates,
        })

        const updated = response.data
        const index = this.transactions.findIndex((t: any) => t.id === id)
        if (index !== -1) {
          this.transactions[index] = updated
        }

        // Refresh balance for the transaction's date
        if (updated.date) {
          await this.fetchBalanceByDate(updated.date)
        }

        console.log('[updateTransaction] Updated transaction:', id)
        return updated
      } catch (error: any) {
        this.error = `Failed to update transaction: ${error.message}`
        console.error('[updateTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Complete a draft transaction
     */
    async completeDraftTransaction(id: string): Promise<MoneyTransferTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/money-transfer/transactions/${id}/complete`, {
          method: 'POST',
        })

        const updated = response.data
        const index = this.transactions.findIndex((t: any) => t.id === id)
        if (index !== -1) {
          this.transactions[index] = updated
        }

        // Update draft count
        this.draftCount = this.transactions.filter((t: any) => t.status === 'draft').length
        this.hasDrafts = this.draftCount > 0

        // Refresh balance for the transaction's date
        if (updated.date) {
          await this.fetchBalanceByDate(updated.date)
        }

        console.log('[completeDraftTransaction] Completed draft:', id)
        return updated
      } catch (error: any) {
        this.error = `Failed to complete draft: ${error.message}`
        console.error('[completeDraftTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Change transaction status (completed ↔ on_hold, on_hold → cancelled)
     */
    async changeTransactionStatus(
      id: string,
      status: 'completed' | 'on_hold' | 'cancelled',
      statusNote: string
    ): Promise<MoneyTransferTransaction> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/money-transfer/transactions/${id}/status`, {
          method: 'PUT',
          body: { status, statusNote },
        })

        const updated = response.data
        const index = this.transactions.findIndex((t: any) => t.id === id)
        if (index !== -1) {
          this.transactions[index] = updated
        }

        // Refresh balance for the transaction's date
        if (updated.date) {
          await this.fetchBalanceByDate(updated.date)
        }

        console.log('[changeTransactionStatus] Changed status:', id, '→', status)
        return updated
      } catch (error: any) {
        this.error = `Failed to change status: ${error.message}`
        console.error('[changeTransactionStatus]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete transaction (usually drafts)
     */
    async deleteTransaction(id: string): Promise<void> {
      this.isLoading = true

      try {
        await $fetch(`/api/money-transfer/transactions/${id}`, {
          method: 'DELETE',
        })

        this.transactions = this.transactions.filter((t: any) => t.id !== id)

        // Update draft count
        this.draftCount = this.transactions.filter((t: any) => t.status === 'draft').length
        this.hasDrafts = this.draftCount > 0

        console.log('[deleteTransaction] Deleted transaction:', id)
      } catch (error: any) {
        this.error = `Failed to delete transaction: ${error.message}`
        console.error('[deleteTransaction]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch current balance for today
     * Named with suffix to avoid conflict with getter
     */
    async fetchCurrentBalanceAction(): Promise<void> {
      try {
        const response = await $fetch('/api/money-transfer/balances/current')
        this.currentBalance = response.data

        console.log('[fetchCurrentBalance] Updated balance:', this.currentBalance)
      } catch (error: any) {
        this.error = `Failed to fetch balance: ${error.message}`
        console.error('[fetchCurrentBalance]', error)
        throw error
      }
    },

    /**
     * Fetch balance for a specific date (used when viewing past dates)
     */
    async fetchBalanceByDate(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/money-transfer/balances/${date}`)
        this.currentBalance = response.data
        console.log('[fetchBalanceByDate] Balance for', date, this.currentBalance)
      } catch (error: any) {
        this.error = `Failed to fetch balance for ${date}: ${error.message}`
        console.error('[fetchBalanceByDate]', error)
      }
    },

    /**
     * Fetch all daily summaries (for History Page WF 2.0)
     */
    async fetchAllSummaries(): Promise<void> {
      try {
        const response = await $fetch('/api/money-transfer/summaries')
        this.summaries = response.data
      } catch (error: any) {
        this.error = `Failed to fetch summaries: ${error.message}`
        throw error
      }
    },

    /**
     * Fetch daily summary for a date
     */
    async fetchDailySummary(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/money-transfer/summaries/${date}`)
        this.currentSummary = response.data

        console.log('[fetchDailySummary] Fetched summary for', date, this.currentSummary)
      } catch (error: any) {
        console.log('[fetchDailySummary] No summary found for', date)
        // It's OK if summary doesn't exist yet
        this.currentSummary = null
      }
    },

    /**
     * Initialize daily summary for a date (creates if not exists).
     * Idempotent — safe to call on page load.
     */
    async initDailySummary(date: string): Promise<void> {
      try {
        const response = await $fetch(`/api/money-transfer/summaries/${date}/init`, { method: 'POST' })
        this.currentSummary = response.data
        console.log('[initDailySummary]', response.created ? 'Created' : 'Already exists', date)
      } catch (error: any) {
        console.error('[initDailySummary] Failed to init summary for', date, error.message)
      }
    },

    /**
     * Fetch previous day balance (for carry-over display in modal)
     */
    async fetchPreviousDayBalance(date: string): Promise<void> {
      try {
        const response = await $fetch('/api/money-transfer/balances/previous', {
          params: { date },
        })
        this.previousDayBalance = response.data
        console.log('[fetchPreviousDayBalance] Previous day balance:', this.previousDayBalance?.bankAccount ?? 'none')
      } catch {
        this.previousDayBalance = null
      }
    },

    /**
     * Set opening balance for a date
     * Only bankAccount is set; other fields stay at 0
     */
    async setOpeningBalance(
      date: string,
      amount: number,
      source: 'carryover' | 'manual',
      userId?: string
    ): Promise<void> {
      try {
        const response = await $fetch('/api/money-transfer/balances/opening', {
          method: 'POST',
          body: { date, amount, source, userId },
        })
        this.currentBalance = response.data
        console.log('[setOpeningBalance] Opening balance set to:', amount, '(', source, ')')
      } catch (error: any) {
        this.error = `Failed to set opening balance: ${error.message}`
        console.error('[setOpeningBalance]', error)
        throw error
      }
    },

    /**
     * Complete Step 1 (Manager transaction recording)
     */
    async completeStep1(date: string): Promise<MoneyTransferDailySummary> {
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        const response = await $fetch(
          `/api/money-transfer/summaries/${date}/complete-step1`,
          {
            method: 'POST',
            body: {
              userId: authStore.user?.uid || 'system',
              userName: authStore.user?.displayName || 'Manager',
            },
          }
        )

        this.currentSummary = response.data

        console.log('[completeStep1] Completed Step 1 for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to complete Step 1: ${error.message}`
        console.error('[completeStep1]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Complete Step 2 (Manager cash verification)
     */
    async completeStep2(date: string, step2Data: any): Promise<MoneyTransferDailySummary> {
      this.isLoading = true

      try {
        const response = await $fetch(
          `/api/money-transfer/summaries/${date}/complete-step2`,
          {
            method: 'POST',
            body: step2Data,
          }
        )

        this.currentSummary = response.data

        console.log('[completeStep2] Completed Step 2 for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to complete Step 2: ${error.message}`
        console.error('[completeStep2]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Submit audit (Workflow 2.2)
     */
    async submitAudit(date: string, auditData: any): Promise<MoneyTransferDailySummary> {
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        const response = await $fetch(`/api/money-transfer/summaries/${date}/audit`, {
          method: 'POST',
          body: {
            ...auditData,
            completedBy: authStore.user?.uid || 'auditor',
            completedByName: authStore.user?.displayName || 'Auditor',
          },
        })

        this.currentSummary = response.data

        console.log('[submitAudit] Submitted audit for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to submit audit: ${error.message}`
        console.error('[submitAudit]', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Submit owner approval (Workflow 2.3)
     */
    async submitOwnerApproval(date: string, approvalData: any): Promise<MoneyTransferDailySummary> {
      this.isLoading = true

      try {
        const response = await $fetch(`/api/money-transfer/summaries/${date}/approve`, {
          method: 'POST',
          body: approvalData,
        })

        this.currentSummary = response.data

        console.log('[submitOwnerApproval] Submitted approval for', date)
        return response.data
      } catch (error: any) {
        this.error = `Failed to submit approval: ${error.message}`
        console.error('[submitOwnerApproval]', error)
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

    // ─── Favorites ─────────────────────────────────────────────────────────────

    /**
     * Load all favorites from API
     */
    async loadFavorites(): Promise<void> {
      try {
        const response = await $fetch<{ success: boolean; data: FavoriteTransfer[] }>(
          '/api/money-transfer/favorites'
        )
        this.favorites = response.data
      } catch (error: any) {
        console.error('[loadFavorites]', error)
      }
    },

    /**
     * Add a new favorite
     */
    async addFavorite(data: Omit<FavoriteTransfer, 'id' | 'createdAt'>): Promise<FavoriteTransfer> {
      const response = await $fetch<{ success: boolean; data: FavoriteTransfer }>(
        '/api/money-transfer/favorites',
        { method: 'POST', body: data }
      )
      this.favorites.push(response.data)
      return response.data
    },

    /**
     * Update an existing favorite
     */
    async updateFavorite(id: string, data: Partial<Omit<FavoriteTransfer, 'id' | 'createdAt'>>): Promise<FavoriteTransfer> {
      const response = await $fetch<{ success: boolean; data: FavoriteTransfer }>(
        `/api/money-transfer/favorites/${id}`,
        { method: 'PUT', body: data }
      )
      const idx = this.favorites.findIndex((f: any) => f.id === id)
      if (idx !== -1) this.favorites[idx] = response.data
      return response.data
    },

    /**
     * Delete a favorite
     */
    async deleteFavorite(id: string): Promise<void> {
      await $fetch(`/api/money-transfer/favorites/${id}`, { method: 'DELETE' })
      this.favorites = this.favorites.filter((f: any) => f.id !== id)
    },

    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Reset filters
     */
    resetFilters(): void {
      this.filters = {
        date: '',
        startDate: '',
        endDate: '',
        status: '',
        transactionType: '',
      }
    },

    /**
     * Select a transaction for editing/viewing
     */
    selectTransaction(transaction: MoneyTransferTransaction | null): void {
      this.selectedTransaction = transaction
    },
  },
})
