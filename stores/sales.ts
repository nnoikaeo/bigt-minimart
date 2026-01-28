import { defineStore } from 'pinia'
import type { DailySalesEntry } from '~/types/repositories'

/**
 * Daily Sales Store
 * 
 * Manages all sales-related state and operations
 * Uses Repository Pattern via API endpoints for flexible data source switching
 * 
 * Phase 1: API calls to salesJsonRepository endpoints
 * Phase 2: API calls to salesFirestoreRepository endpoints (no client code changes)
 */
export const useSalesStore = defineStore('sales', {
  state: () => ({
    /**
     * Array of all daily sales entries
     */
    dailySales: [] as DailySalesEntry[],

    /**
     * Currently selected/editing entry
     */
    selectedEntry: null as DailySalesEntry | null,

    /**
     * Filter state
     */
    filters: {
      dateFrom: '',
      dateTo: '',
      status: '' as '' | 'submitted' | 'audited' | 'approved',
      cashierName: '',
    },

    /**
     * Sorting state
     */
    sortBy: 'date' as 'date' | 'cashierName' | 'total',
    sortOrder: 'desc' as 'asc' | 'desc',

    /**
     * Loading and error states
     */
    isLoading: false,
    error: null as string | null,

    /**
     * Statistics
     */
    stats: {
      totalSales: 0,
      totalEntries: 0,
      pendingApproval: 0,
      approvedToday: 0,
    },
  }),

  getters: {
    /**
     * Get all sales entries
     */
    getAllSales: (state) => state.dailySales,

    /**
     * Get filtered sales entries
     */
    getFilteredSales: (state) => {
      return state.dailySales.filter((sale) => {
        // Filter by date range
        if (state.filters.dateFrom && sale.date < state.filters.dateFrom) {
          return false
        }
        if (state.filters.dateTo && sale.date > state.filters.dateTo) {
          return false
        }

        // Filter by status
        if (state.filters.status && sale.status !== state.filters.status) {
          return false
        }

        // Filter by cashier name
        if (
          state.filters.cashierName &&
          !sale.cashierName
            .toLowerCase()
            .includes(state.filters.cashierName.toLowerCase())
        ) {
          return false
        }

        return true
      })
    },

    /**
     * Get pending approval entries (submitted status)
     */
    getPendingSales: (state) => {
      return state.dailySales.filter((sale) => sale.status === 'submitted')
    },

    /**
     * Get approved entries
     */
    getApprovedSales: (state) => {
      return state.dailySales.filter((sale) => sale.status === 'approved')
    },

    /**
     * Get sorted filtered sales
     */
    getSortedFilteredSales: (state) => {
      const filtered = state.dailySales.filter((sale) => {
        if (state.filters.dateFrom && sale.date < state.filters.dateFrom) {
          return false
        }
        if (state.filters.dateTo && sale.date > state.filters.dateTo) {
          return false
        }
        if (state.filters.status && sale.status !== state.filters.status) {
          return false
        }
        if (
          state.filters.cashierName &&
          !sale.cashierName
            .toLowerCase()
            .includes(state.filters.cashierName.toLowerCase())
        ) {
          return false
        }
        return true
      })

      return [...filtered].sort((a, b) => {
        let aVal: any = a[state.sortBy as keyof typeof a]
        let bVal: any = b[state.sortBy as keyof typeof b]

        // Handle numeric comparison for total
        if (state.sortBy === 'total') {
          aVal =
            a.posposData.cash +
            a.posposData.qr +
            a.posposData.bank +
            a.posposData.government
          bVal =
            b.posposData.cash +
            b.posposData.qr +
            b.posposData.bank +
            b.posposData.government
        }

        if (state.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    },

    /**
     * Get sales statistics
     */
    getSalesStats: (state) => state.stats,

    /**
     * Get selected entry
     */
    getSelectedEntry: (state) => state.selectedEntry,

    /**
     * Get loading state
     */
    getIsLoading: (state) => state.isLoading,

    /**
     * Get error state
     */
    getError: (state) => state.error,

    /**
     * Get total sales amount
     */
    getTotalSalesAmount: (state) => {
      return state.dailySales.reduce(
        (sum, sale) => {
          // Validate entry has required fields
          if (!sale.posposData) {
            console.warn('[getTotalSalesAmount] Entry missing posposData:', sale.id)
            return sum
          }
          return (
            sum +
            (sale.posposData.cash || 0) +
            (sale.posposData.qr || 0) +
            (sale.posposData.bank || 0) +
            (sale.posposData.government || 0)
          )
        },
        0
      )
    },

    /**
     * Get sales by payment method
     */
    getSalesByPaymentMethod: (state) => {
      const byMethod = {
        cash: 0,
        qr: 0,
        bank: 0,
        government: 0,
      }

      state.dailySales.forEach((sale) => {
        byMethod.cash += sale.posposData.cash
        byMethod.qr += sale.posposData.qr
        byMethod.bank += sale.posposData.bank
        byMethod.government += sale.posposData.government
      })

      return byMethod
    },
  },

  actions: {
    /**
     * Initialize store: Load all sales from API
     */
    async initializeStore(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        // Fetch all sales via API
        const response = await $fetch<{ success: boolean; data: DailySalesEntry[]; count: number }>('/api/daily-sales')
        this.dailySales = response?.data || []

        // Calculate statistics
        this.calculateStats()

        console.log('✅ Sales store initialized')
      } catch (err) {
        this.error = `Failed to initialize sales store: ${err}`
        console.error('❌ Sales store initialization failed:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch all sales entries from API
     */
    async fetchDailySales(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: DailySalesEntry[]; count: number }>('/api/daily-sales')
        this.dailySales = response?.data || []
        this.calculateStats()
      } catch (err) {
        this.error = `Failed to fetch sales: ${err}`
        console.error('❌ Fetch sales failed:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Get single sales entry by ID from API
     */
    async fetchSaleById(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: DailySalesEntry }>(`/api/daily-sales/${id}`)
        this.selectedEntry = response?.data || null
      } catch (err) {
        this.error = `Failed to fetch sale: ${err}`
        console.error('❌ Fetch sale by ID failed:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Add new daily sales entry via API
     */
    async addDailySale(
      entry: Omit<
        DailySalesEntry,
        'id' | 'submittedAt' | 'submittedBy' | 'createdAt' | 'updatedAt'
      >
    ): Promise<DailySalesEntry> {
      this.isLoading = true
      this.error = null

      try {
        // Add entry via API
        const response = await $fetch<{ success: boolean; data: DailySalesEntry; message: string }>('/api/daily-sales', {
          method: 'POST',
          body: entry,
        })

        console.log('[addDailySale] Full response from API:', response)
        
        // Extract the actual entry from the response wrapper
        const newEntry = response?.data
        
        console.log('[addDailySale] Extracted entry:', newEntry)
        console.log('[addDailySale] Entry has posposData:', !!newEntry?.posposData)
        console.log('[addDailySale] Entry has cashierName:', !!newEntry?.cashierName)
        console.log('[addDailySale] Entry keys:', Object.keys(newEntry || {}))

        // Validate entry has all required fields
        if (!newEntry?.posposData) {
          console.error('[addDailySale] ❌ New entry missing posposData:', newEntry)
          throw new Error('Invalid response: missing posposData')
        }
        if (!newEntry?.cashierName) {
          console.error('[addDailySale] ❌ New entry missing cashierName:', newEntry)
          throw new Error('Invalid response: missing cashierName')
        }

        // Add to local state
        this.dailySales.push(newEntry)

        // Recalculate statistics
        this.calculateStats()

        console.log('✅ Daily sale added:', newEntry.id)
        return newEntry
      } catch (err) {
        this.error = `Failed to add daily sale: ${err}`
        console.error('❌ Add daily sale failed:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update existing sales entry via API
     */
    async updateDailySale(
      id: string,
      updates: Partial<DailySalesEntry>
    ): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        console.log('[updateDailySale] Updating entry:', id)
        console.log('[updateDailySale] Updates:', updates)
        
        // Update via API
        const response = await $fetch<{ success: boolean; data: DailySalesEntry; message: string }>(
          `/api/daily-sales/${id}`,
          {
            method: 'PUT',
            body: updates,
          }
        )

        console.log('[updateDailySale] Response:', response)

        // Extract the updated entry from response
        const updatedEntry = response?.data

        console.log('[updateDailySale] Extracted entry:', updatedEntry)
        
        if (!updatedEntry) {
          console.error('[updateDailySale] ❌ Response has no data:', response)
          throw new Error('Invalid response: missing data')
        }

        // Update local state
        const index = this.dailySales.findIndex((s) => s.id === id)
        if (index >= 0) {
          console.log('[updateDailySale] Updating array index:', index)
          this.dailySales[index] = updatedEntry
          console.log('[updateDailySale] Updated entry in state:', this.dailySales[index])
        } else {
          console.warn('[updateDailySale] Entry not found in local state:', id)
        }

        // Recalculate statistics
        this.calculateStats()

        console.log('✅ Daily sale updated:', id)
      } catch (err) {
        this.error = `Failed to update daily sale: ${err}`
        console.error('❌ Update daily sale failed:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete sales entry via API
     */
    async deleteDailySale(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        console.log('[deleteDailySale] Deleting entry:', id)
        // Delete via API
        const response = await $fetch<{ success: boolean; message: string }>(`/api/daily-sales/${id}`, {
          method: 'DELETE',
        })

        console.log('[deleteDailySale] Delete response:', response)

        // Remove from local state
        const beforeCount = this.dailySales.length
        this.dailySales = this.dailySales.filter((s) => s.id !== id)
        const afterCount = this.dailySales.length

        console.log(`[deleteDailySale] Removed from state: ${beforeCount} → ${afterCount} entries`)

        // Recalculate statistics
        this.calculateStats()

        console.log('✅ Daily sale deleted:', id)
      } catch (err) {
        this.error = `Failed to delete daily sale: ${err}`
        console.error('❌ Delete daily sale failed:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Approve sales entry (change status to approved)
     */
    async approveSale(id: string, auditNotes?: string): Promise<void> {
      await this.updateDailySale(id, {
        status: 'approved',
        auditNotes,
        auditedAt: new Date().toISOString(),
      })
    },

    /**
     * Set filters
     */
    setFilters(filters: Partial<typeof this.filters>): void {
      this.filters = { ...this.filters, ...filters }
    },

    /**
     * Clear filters
     */
    clearFilters(): void {
      this.filters = {
        dateFrom: '',
        dateTo: '',
        status: '',
        cashierName: '',
      }
    },

    /**
     * Set sort order
     */
    setSortOrder(
      sortBy: 'date' | 'cashierName' | 'total',
      sortOrder: 'asc' | 'desc'
    ): void {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },

    /**
     * Select entry for editing
     */
    selectEntry(entry: DailySalesEntry | null): void {
      this.selectedEntry = entry
    },

    /**
     * Calculate and update statistics
     */
    calculateStats(): void {
      this.stats.totalSales = this.getTotalSalesAmount
      this.stats.totalEntries = this.dailySales.length
      this.stats.pendingApproval = this.getPendingSales.length
      this.stats.approvedToday = this.getApprovedSales.filter(
        (s) =>
          new Date(s.submittedAt as string | Date).toDateString() ===
          new Date().toDateString()
      ).length
    },

    /**
     * Clear error message
     */
    clearError(): void {
      this.error = null
    },
  },
})
