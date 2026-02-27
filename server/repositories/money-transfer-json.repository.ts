/**
 * JSON Repository Implementation for Money Transfer Service
 * ✅ Used during development
 * 📝 Uses local JSON files for data storage
 * 🔄 Can be swapped with FirestoreRepository later without changing stores/components
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type {
  MoneyTransferTransaction,
  MoneyTransferDailySummary,
  MoneyTransferBalance,
  FavoriteTransfer,
  IMoneyTransferRepository,
} from '~/types/repositories'

/**
 * JSON Repository for Money Transfer Service
 * - Loads/saves data from/to JSON files
 * - Perfect for development and testing
 * - Can be replaced with Firestore version later
 */
export class MoneyTransferJsonRepository implements IMoneyTransferRepository {
  private transactions: MoneyTransferTransaction[] = []
  private summaries: MoneyTransferDailySummary[] = []
  private balances: MoneyTransferBalance[] = []
  private favorites: FavoriteTransfer[] = []

  private transactionsFile: string
  private summariesFile: string
  private balancesFile: string
  private favoritesFile: string

  constructor() {
    // Store data in public directory for easy access during development
    this.transactionsFile = join(
      process.cwd(),
      'public',
      'data',
      'money-transfer-transactions.json'
    )
    this.summariesFile = join(process.cwd(), 'public', 'data', 'money-transfer-summaries.json')
    this.balancesFile = join(process.cwd(), 'public', 'data', 'money-transfer-balances.json')
    this.favoritesFile = join(process.cwd(), 'public', 'data', 'money-transfer-favorites.json')
  }

  /**
   * Initialize: Load data from JSON files
   * Called once on server startup
   */
  async init(): Promise<void> {
    try {
      // Load transactions
      try {
        const transContent = await fs.readFile(this.transactionsFile, 'utf-8')
        this.transactions = JSON.parse(transContent) as MoneyTransferTransaction[]
      } catch {
        this.transactions = []
      }

      // Load summaries
      try {
        const summContent = await fs.readFile(this.summariesFile, 'utf-8')
        this.summaries = JSON.parse(summContent) as MoneyTransferDailySummary[]
      } catch {
        this.summaries = []
      }

      // Load balances
      try {
        const balContent = await fs.readFile(this.balancesFile, 'utf-8')
        this.balances = JSON.parse(balContent) as MoneyTransferBalance[]
      } catch {
        this.balances = []
      }

      // Load favorites
      try {
        const favContent = await fs.readFile(this.favoritesFile, 'utf-8')
        this.favorites = JSON.parse(favContent) as FavoriteTransfer[]
      } catch {
        this.favorites = []
      }

      console.log(`✅ Loaded ${this.transactions.length} transactions from JSON`)
      console.log(`✅ Loaded ${this.summaries.length} summaries from JSON`)
      console.log(`✅ Loaded ${this.balances.length} balance records from JSON`)
      console.log(`✅ Loaded ${this.favorites.length} favorites from JSON`)
    } catch (error) {
      console.log('📝 No data files found, starting with empty data')
      this.transactions = []
      this.summaries = []
      this.balances = []
      await this.ensureDataDir()
    }
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDir(): Promise<void> {
    try {
      const dir = join(process.cwd(), 'public', 'data')
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      console.error('Failed to create data directory:', error)
    }
  }

  /**
   * Save all data to JSON files
   * Called after every write operation
   */
  private async save(): Promise<void> {
    try {
      await this.ensureDataDir()

      // Save transactions
      const transJson = JSON.stringify(this.transactions, null, 2)
      await fs.writeFile(this.transactionsFile, transJson, 'utf-8')

      // Save summaries
      const summJson = JSON.stringify(this.summaries, null, 2)
      await fs.writeFile(this.summariesFile, summJson, 'utf-8')

      // Save balances
      const balJson = JSON.stringify(this.balances, null, 2)
      await fs.writeFile(this.balancesFile, balJson, 'utf-8')

      // Save favorites
      const favJson = JSON.stringify(this.favorites, null, 2)
      await fs.writeFile(this.favoritesFile, favJson, 'utf-8')

      console.log(`✅ Saved ${this.transactions.length} transactions to JSON`)
    } catch (error) {
      console.error('❌ Failed to save to JSON:', error)
      throw new Error('Failed to save money transfer data')
    }
  }

  /**
   * READ: Get single transaction by ID
   */
  async getTransaction(id: string): Promise<MoneyTransferTransaction> {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`)
    }
    return transaction
  }

  /**
   * READ: Get transactions for a specific date
   */
  async getTransactionsByDate(date: string): Promise<MoneyTransferTransaction[]> {
    return this.transactions.filter(t => t.date === date)
  }

  /**
   * READ: Get transactions by date range
   */
  async getTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<MoneyTransferTransaction[]> {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')

    return this.transactions.filter(t => {
      const txnDate = new Date(t.date + 'T00:00:00')
      return txnDate >= start && txnDate <= end
    })
  }

  /**
   * READ: Get transactions by status
   */
  async getTransactionsByStatus(status: MoneyTransferTransaction['status']): Promise<MoneyTransferTransaction[]> {
    return this.transactions.filter(t => t.status === status)
  }

  /**
   * READ: Get draft transactions for a date
   */
  async getDraftTransactions(date: string): Promise<MoneyTransferTransaction[]> {
    return this.transactions.filter(t => t.date === date && t.status === 'draft')
  }

  /**
   * WRITE: Add new transaction
   * - Generates unique ID
   * - Sets createdAt timestamp
   * - Saves to JSON file
   */
  async addTransaction(
    transaction: Omit<MoneyTransferTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MoneyTransferTransaction> {
    // Generate unique ID
    const id = `mts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create new transaction with timestamps
    const newTransaction: MoneyTransferTransaction = {
      ...transaction,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Validate
    this.validateTransaction(newTransaction)

    // Add to in-memory data
    this.transactions.push(newTransaction)

    // Save to file
    await this.save()

    console.log(`✅ Added transaction: ${id}`)
    return newTransaction
  }

  /**
   * WRITE: Update existing transaction
   */
  async updateTransaction(
    id: string,
    updates: Partial<MoneyTransferTransaction>
  ): Promise<MoneyTransferTransaction> {
    const index = this.transactions.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found`)
    }

    const existing = this.transactions[index]!
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Always use original ID
      createdAt: existing.createdAt, // Never update
      updatedAt: new Date().toISOString(),
    } as MoneyTransferTransaction

    // Validate
    this.validateTransaction(updated)

    // Update in-memory data
    this.transactions[index] = updated

    // Save to file
    await this.save()

    console.log(`✅ Updated transaction: ${id}`)
    return updated
  }

  /**
   * WRITE: Delete transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found`)
    }

    this.transactions.splice(index, 1)
    await this.save()

    console.log(`✅ Deleted transaction: ${id}`)
  }

  /**
   * WRITE: Complete draft transaction
   * Updates transaction status and balance impacts
   */
  async completeDraftTransaction(
    id: string,
    updates: Partial<MoneyTransferTransaction>
  ): Promise<MoneyTransferTransaction> {
    const transaction = await this.getTransaction(id)

    if (transaction.status !== 'draft') {
      throw new Error('Only draft transactions can be completed')
    }

    return this.updateTransaction(id, {
      ...updates,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * READ: Get daily summary
   */
  async getDailySummary(date: string): Promise<MoneyTransferDailySummary | null> {
    const summary = this.summaries.find(s => s.date === date)
    return summary || null
  }

  /**
   * WRITE: Create daily summary
   */
  async createDailySummary(date: string): Promise<MoneyTransferDailySummary> {
    // Check if already exists
    const existing = this.summaries.find(s => s.date === date)
    if (existing) {
      throw new Error(`Summary for ${date} already exists`)
    }

    const summary: MoneyTransferDailySummary = {
      id: `mtsum-${date}`,
      date,
      step1: {
        status: 'in_progress',
        totalTransactions: 0,
        completedTransactions: 0,
        draftTransactions: 0,
        totalAmount: 0,
        totalCommission: 0,
      },
      workflowStatus: 'step1_in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.summaries.push(summary)
    await this.save()

    console.log(`✅ Created summary for ${date}`)
    return summary
  }

  /**
   * WRITE: Update daily summary
   */
  async updateDailySummary(
    date: string,
    updates: Partial<MoneyTransferDailySummary>
  ): Promise<MoneyTransferDailySummary> {
    const index = this.summaries.findIndex(s => s.date === date)
    if (index === -1) {
      throw new Error(`Summary for ${date} not found`)
    }

    const existing = this.summaries[index]!
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      date: existing.date,
      updatedAt: new Date().toISOString(),
    } as MoneyTransferDailySummary

    this.summaries[index] = updated
    await this.save()

    console.log(`✅ Updated summary for ${date}`)
    return updated
  }

  /**
   * READ: Get current balance for a date
   */
  async getCurrentBalance(date: string): Promise<MoneyTransferBalance> {
    let balance = this.balances.find(b => b.date === date)

    if (!balance) {
      // Initialize with zero balance if doesn't exist
      balance = await this.initializeBalance(date)
    }

    return balance
  }

  /**
   * WRITE: Initialize balance for a date
   */
  async initializeBalance(date: string): Promise<MoneyTransferBalance> {
    const balance: MoneyTransferBalance = {
      id: `mtbal-${date}`,
      date,
      bankAccount: 0,
      transferCash: 0,
      serviceFeeTransfer: 0,
      serviceFeeCash: 0,
      history: [],
      updatedAt: new Date().toISOString(),
    }

    this.balances.push(balance)
    await this.save()

    console.log(`✅ Initialized balance for ${date}`)
    return balance
  }

  /**
   * WRITE: Update balance
   */
  async updateBalance(
    date: string,
    updates: Partial<MoneyTransferBalance>
  ): Promise<MoneyTransferBalance> {
    const index = this.balances.findIndex(b => b.date === date)
    if (index === -1) {
      throw new Error(`Balance for ${date} not found`)
    }

    const existing = this.balances[index]!
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      date: existing.date,
      updatedAt: new Date().toISOString(),
    } as MoneyTransferBalance

    this.balances[index] = updated
    await this.save()

    console.log(`✅ Updated balance for ${date}`)
    return updated
  }

  /**
   * WRITE: Set opening balance for a date
   * Only bankAccount is set; other fields stay at 0
   */
  async setOpeningBalance(
    date: string,
    amount: number,
    source: 'carryover' | 'manual',
    userId?: string
  ): Promise<MoneyTransferBalance> {
    let balance = this.balances.find(b => b.date === date)
    if (!balance) {
      balance = await this.initializeBalance(date)
    }
    return this.updateBalance(date, {
      bankAccount: amount,
      openingBalance: amount,
      openingBalanceSetAt: new Date().toISOString(),
      openingBalanceSource: source,
      openingBalanceSetBy: userId,
    })
  }

  /**
   * READ: Get balance record for the day before a given date
   */
  async getPreviousDayBalance(date: string): Promise<MoneyTransferBalance | null> {
    const prev = new Date(date + 'T00:00:00')
    prev.setDate(prev.getDate() - 1)
    const prevDate = prev.toISOString().split('T')[0]
    return this.balances.find(b => b.date === prevDate) || null
  }

  /**
   * WRITE: Complete Step 1 (Manager transaction recording)
   */
  async completeStep1(
    date: string,
    userId: string,
    userName: string
  ): Promise<MoneyTransferDailySummary> {
    // Get or create summary
    let summary = await this.getDailySummary(date)
    if (!summary) {
      summary = await this.createDailySummary(date)
    }

    // Get transactions for this date
    const transactions = await this.getTransactionsByDate(date)
    const completed = transactions.filter(t => t.status === 'completed')

    // Update summary
    return this.updateDailySummary(date, {
      step1: {
        ...summary.step1,
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: userId,
        completedByName: userName,
        totalTransactions: transactions.length,
        completedTransactions: completed.length,
        draftTransactions: transactions.filter(t => t.status === 'draft').length,
        totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
        totalCommission: completed.reduce((sum, t) => sum + (t.commission || 0), 0),
      },
      workflowStatus: 'step1_completed',
    })
  }

  /**
   * WRITE: Complete Step 2 (Manager cash verification)
   */
  async completeStep2(
    date: string,
    step2Data: MoneyTransferDailySummary['step2']
  ): Promise<MoneyTransferDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) {
      throw new Error(`Summary for ${date} not found`)
    }

    return this.updateDailySummary(date, {
      step2: {
        status: 'completed',
        completedAt: step2Data?.completedAt,
        completedBy: step2Data?.completedBy,
        completedByName: step2Data?.completedByName,
        expectedCash: step2Data?.expectedCash ?? { transferWithdrawal: 0, serviceFee: 0, total: 0 },
        actualCash: step2Data?.actualCash ?? { transferWithdrawal: 0, serviceFee: 0, total: 0 },
        differences: step2Data?.differences ?? { transferWithdrawal: 0, serviceFee: 0, total: 0 },
        verificationNotes: step2Data?.verificationNotes,
        hasDiscrepancies: step2Data?.hasDiscrepancies ?? false,
      },
      workflowStatus: 'step2_completed',
    })
  }

  /**
   * WRITE: Complete audit (Workflow 2.2)
   */
  async completeAudit(
    date: string,
    auditData: MoneyTransferDailySummary['auditorVerification']
  ): Promise<MoneyTransferDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) {
      throw new Error(`Summary for ${date} not found`)
    }

    return this.updateDailySummary(date, {
      auditorVerification: {
        status: 'completed',
        completedAt: auditData?.completedAt,
        completedBy: auditData?.completedBy,
        completedByName: auditData?.completedByName,
        transactionsVerified: auditData?.transactionsVerified ?? 0,
        transactionsWithIssues: auditData?.transactionsWithIssues ?? 0,
        bankStatementVerified: auditData?.bankStatementVerified ?? false,
        bankBalanceMatches: auditData?.bankBalanceMatches ?? false,
        auditNotes: auditData?.auditNotes ?? '',
        issuesFound: auditData?.issuesFound,
        auditResult: auditData?.auditResult ?? 'no_issues',
      },
      workflowStatus: 'audited',
    })
  }

  /**
   * WRITE: Owner approval (Workflow 2.3)
   */
  async approveByOwner(
    date: string,
    approvalData: MoneyTransferDailySummary['ownerApproval']
  ): Promise<MoneyTransferDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) {
      throw new Error(`Summary for ${date} not found`)
    }

    // Determine workflow status and approval status based on decision
    const decision = approvalData?.decision ?? 'approve'
    const workflowStatus: MoneyTransferDailySummary['workflowStatus'] = decision === 'request_correction' ? 'needs_correction' : 'approved'
    const approvalStatus: 'approved' | 'approved_with_notes' | 'correction_requested' =
      decision === 'approve'
        ? 'approved'
        : decision === 'approve_with_notes'
          ? 'approved_with_notes'
          : 'correction_requested'

    return this.updateDailySummary(date, {
      ownerApproval: {
        status: approvalStatus,
        completedAt: approvalData?.completedAt,
        completedBy: approvalData?.completedBy,
        completedByName: approvalData?.completedByName,
        decision,
        ownerNotes: approvalData?.ownerNotes,
      },
      workflowStatus,
    })
  }

  /**
   * READ: Get transaction count for a date
   */
  async getTransactionCount(date: string): Promise<number> {
    return this.transactions.filter(t => t.date === date).length
  }

  /**
   * READ: Get transaction count by status
   */
  async getTransactionCountByStatus(date: string, status: string): Promise<number> {
    return this.transactions.filter(t => t.date === date && t.status === status).length
  }

  // ─── Favorites ───────────────────────────────────────────────────────────────

  /**
   * READ: Get all favorites
   */
  async getFavorites(): Promise<FavoriteTransfer[]> {
    return [...this.favorites].sort((a, b) => a.tab - b.tab || a.order - b.order)
  }

  /**
   * READ: Get favorites for a specific tab
   */
  async getFavoritesByTab(tab: 1 | 2 | 3 | 4 | 5): Promise<FavoriteTransfer[]> {
    return this.favorites
      .filter(f => f.tab === tab)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * WRITE: Add new favorite
   */
  async addFavorite(
    data: Omit<FavoriteTransfer, 'id' | 'createdAt'>
  ): Promise<FavoriteTransfer> {
    const tabItems = this.favorites.filter(f => f.tab === data.tab)
    if (tabItems.length >= 10) {
      throw new Error(`Tab #${data.tab} is full (max 10 favorites)`)
    }

    const newFav: FavoriteTransfer = {
      ...data,
      id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    this.favorites.push(newFav)
    await this.save()
    return newFav
  }

  /**
   * WRITE: Update existing favorite
   */
  async updateFavorite(id: string, data: Partial<Omit<FavoriteTransfer, 'id' | 'createdAt'>>): Promise<FavoriteTransfer> {
    const idx = this.favorites.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`Favorite ${id} not found`)
    const existing = this.favorites[idx]!
    this.favorites[idx] = { ...existing, ...data }
    await this.save()
    return this.favorites[idx]!
  }

  /**
   * WRITE: Delete a favorite
   */
  async deleteFavorite(id: string): Promise<void> {
    const idx = this.favorites.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`Favorite ${id} not found`)
    this.favorites.splice(idx, 1)
    await this.save()
  }

  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Validate transaction data
   * Throws error if data is invalid
   */
  private validateTransaction(transaction: MoneyTransferTransaction): void {
    if (!transaction.date) throw new Error('Date is required')
    if (!transaction.datetime) throw new Error('DateTime is required')
    if (!transaction.transactionType)
      throw new Error('Transaction type is required (transfer, withdrawal, owner_deposit)')
    if (transaction.amount < 0) throw new Error('Amount cannot be negative')
    if ((transaction.commission || 0) < 0) throw new Error('Commission cannot be negative')
    if (!transaction.balanceImpact) throw new Error('Balance impact snapshot is required')
    if (!transaction.recordedBy) throw new Error('Recorded by user ID is required')
    if (!transaction.recordedByName) throw new Error('Recorded by user name is required')
  }
}

/**
 * Export singleton instance
 * Used throughout the application
 */
export const moneyTransferJsonRepository = new MoneyTransferJsonRepository()
