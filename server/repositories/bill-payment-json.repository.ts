/**
 * JSON Repository Implementation for Bill Payment Service
 * ✅ Used during development
 * 📝 Uses local JSON files for data storage
 * 🔄 Can be swapped with FirestoreRepository later without changing stores/components
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type {
  BillPaymentTransaction,
  BillPaymentDailySummary,
  BillPaymentBalance,
  BillPaymentFavorite,
} from '~/types/bill-payment'

export class BillPaymentJsonRepository {
  private transactions: BillPaymentTransaction[] = []
  private summaries: BillPaymentDailySummary[] = []
  private balances: BillPaymentBalance[] = []
  private favorites: BillPaymentFavorite[] = []

  private transactionsFile: string
  private summariesFile: string
  private balancesFile: string
  private favoritesFile: string

  constructor() {
    this.transactionsFile = join(process.cwd(), 'public', 'data', 'bill-payment-transactions.json')
    this.summariesFile = join(process.cwd(), 'public', 'data', 'bill-payment-summaries.json')
    this.balancesFile = join(process.cwd(), 'public', 'data', 'bill-payment-balances.json')
    this.favoritesFile = join(process.cwd(), 'public', 'data', 'bill-payment-favorites.json')
  }

  // ─── Init & Persistence ──────────────────────────────────────────────────────

  async init(): Promise<void> {
    try {
      try {
        const content = await fs.readFile(this.transactionsFile, 'utf-8')
        this.transactions = JSON.parse(content) as BillPaymentTransaction[]
      } catch {
        this.transactions = []
      }

      try {
        const content = await fs.readFile(this.summariesFile, 'utf-8')
        this.summaries = JSON.parse(content) as BillPaymentDailySummary[]
      } catch {
        this.summaries = []
      }

      try {
        const content = await fs.readFile(this.balancesFile, 'utf-8')
        this.balances = JSON.parse(content) as BillPaymentBalance[]
      } catch {
        this.balances = []
      }

      try {
        const content = await fs.readFile(this.favoritesFile, 'utf-8')
        this.favorites = JSON.parse(content) as BillPaymentFavorite[]
      } catch {
        this.favorites = []
      }

      console.log(`✅ [bill-payment] Loaded ${this.transactions.length} transactions`)
      console.log(`✅ [bill-payment] Loaded ${this.summaries.length} summaries`)
      console.log(`✅ [bill-payment] Loaded ${this.balances.length} balance records`)
      console.log(`✅ [bill-payment] Loaded ${this.favorites.length} favorites`)
    } catch (error) {
      console.log('📝 [bill-payment] Starting with empty data')
      this.transactions = []
      this.summaries = []
      this.balances = []
      this.favorites = []
    }
  }

  private async ensureDataDir(): Promise<void> {
    const dir = join(process.cwd(), 'public', 'data')
    await fs.mkdir(dir, { recursive: true })
  }

  private async save(): Promise<void> {
    try {
      await this.ensureDataDir()
      await fs.writeFile(this.transactionsFile, JSON.stringify(this.transactions, null, 2), 'utf-8')
      await fs.writeFile(this.summariesFile, JSON.stringify(this.summaries, null, 2), 'utf-8')
      await fs.writeFile(this.balancesFile, JSON.stringify(this.balances, null, 2), 'utf-8')
      await fs.writeFile(this.favoritesFile, JSON.stringify(this.favorites, null, 2), 'utf-8')
    } catch (error) {
      console.error('❌ [bill-payment] Failed to save:', error)
      throw new Error('Failed to save bill payment data')
    }
  }

  // ─── Transactions ─────────────────────────────────────────────────────────────

  async getTransaction(id: string): Promise<BillPaymentTransaction> {
    const txn = this.transactions.find(t => t.id === id)
    if (!txn) throw new Error(`Transaction ${id} not found`)
    return txn
  }

  async getTransactionsByDate(date: string): Promise<BillPaymentTransaction[]> {
    return this.transactions.filter(t => t.date === date)
  }

  async getTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<BillPaymentTransaction[]> {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')
    return this.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d >= start && d <= end
    })
  }

  async addTransaction(
    data: Omit<BillPaymentTransaction, 'id'>
  ): Promise<BillPaymentTransaction> {
    const id = `bptxn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTxn: BillPaymentTransaction = { ...data, id }

    this.transactions.push(newTxn)

    // Recalculate balance for this date
    await this.recalculateBalance(data.date)

    await this.save()
    console.log(`✅ [bill-payment] Added transaction: ${id}`)
    return newTxn
  }

  async updateTransaction(
    id: string,
    updates: Partial<BillPaymentTransaction>
  ): Promise<BillPaymentTransaction> {
    const index = this.transactions.findIndex(t => t.id === id)
    if (index === -1) throw new Error(`Transaction ${id} not found`)

    const existing = this.transactions[index]!
    const updated: BillPaymentTransaction = { ...existing, ...updates, id: existing.id }
    this.transactions[index] = updated

    // Recalculate balance for this date
    await this.recalculateBalance(existing.date)

    await this.save()
    console.log(`✅ [bill-payment] Updated transaction: ${id}`)
    return updated
  }

  async deleteTransaction(id: string): Promise<void> {
    const txn = this.transactions.find(t => t.id === id)
    if (!txn) throw new Error(`Transaction ${id} not found`)

    const date = txn.date
    this.transactions = this.transactions.filter(t => t.id !== id)

    await this.recalculateBalance(date)
    await this.save()
    console.log(`✅ [bill-payment] Deleted transaction: ${id}`)
  }

  // ─── Balance ──────────────────────────────────────────────────────────────────

  /**
   * Recalculate balance for a date from opening balance + all completed transactions.
   * bill_payment completed: bankAccount -= amount, billPaymentCash += amount, serviceFeeCash += commission
   * owner_deposit completed: bankAccount += amount
   * draft / on_hold / cancelled: no change
   */
  private async recalculateBalance(date: string): Promise<void> {
    let balance = this.balances.find(b => b.date === date)
    if (!balance) {
      balance = await this.initializeBalance(date)
    }

    const openingBank = balance.openingBalance ?? 0

    let bankAccount = openingBank
    let billPaymentCash = 0
    let serviceFeeCash = 0

    const dayTxns = this.transactions
      .filter(t => t.date === date && t.status === 'completed')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    for (const txn of dayTxns) {
      if (txn.transactionType === 'bill_payment') {
        bankAccount -= txn.amount
        billPaymentCash += txn.amount
        serviceFeeCash += txn.commission ?? 0
      } else if (txn.transactionType === 'owner_deposit') {
        bankAccount += txn.amount
      }
    }

    const idx = this.balances.findIndex(b => b.date === date)
    if (idx !== -1) {
      this.balances[idx] = {
        ...this.balances[idx]!,
        bankAccount,
        billPaymentCash,
        serviceFeeCash,
        updatedAt: new Date().toISOString(),
      }
    }
  }

  async getCurrentBalance(date: string): Promise<BillPaymentBalance> {
    let balance = this.balances.find(b => b.date === date)
    if (!balance) {
      balance = await this.initializeBalance(date)
    }
    return balance
  }

  async initializeBalance(date: string): Promise<BillPaymentBalance> {
    const existing = this.balances.find(b => b.date === date)
    if (existing) return existing

    const balance: BillPaymentBalance = {
      id: `bpbal-${date}`,
      date,
      bankAccount: 0,
      billPaymentCash: 0,
      serviceFeeCash: 0,
      history: [],
      updatedAt: new Date().toISOString(),
    }
    this.balances.push(balance)
    await this.save()
    console.log(`✅ [bill-payment] Initialized balance for ${date}`)
    return balance
  }

  async setOpeningBalance(
    date: string,
    amount: number,
    source: 'carryover' | 'manual',
    userId?: string
  ): Promise<BillPaymentBalance> {
    let balance = this.balances.find(b => b.date === date)
    if (!balance) {
      balance = await this.initializeBalance(date)
    }

    const idx = this.balances.findIndex(b => b.date === date)
    this.balances[idx] = {
      ...this.balances[idx]!,
      openingBalance: Number(amount),
      openingBalanceSetAt: new Date().toISOString(),
      openingBalanceSource: source,
      openingBalanceSetBy: userId,
      updatedAt: new Date().toISOString(),
    }

    // Recalculate totals with new opening balance
    await this.recalculateBalance(date)
    await this.save()
    return this.balances.find(b => b.date === date)!
  }

  async getPreviousDayBalance(date: string): Promise<BillPaymentBalance | null> {
    const sorted = this.balances
      .filter(b => b.date < date && b.openingBalanceSource != null)
      .sort((a, b) => b.date.localeCompare(a.date))
    return sorted[0] || null
  }

  // ─── Summaries ────────────────────────────────────────────────────────────────

  async getAllSummaries(): Promise<BillPaymentDailySummary[]> {
    return [...this.summaries].sort((a, b) => b.date.localeCompare(a.date))
  }

  async getDailySummary(date: string): Promise<BillPaymentDailySummary | null> {
    return this.summaries.find(s => s.date === date) || null
  }

  async createDailySummary(date: string): Promise<BillPaymentDailySummary> {
    const existing = this.summaries.find(s => s.date === date)
    if (existing) return existing

    const summary: BillPaymentDailySummary = {
      id: `bpsum-${date}`,
      date,
      workflowStatus: 'step1_in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.summaries.push(summary)
    await this.save()
    console.log(`✅ [bill-payment] Created summary for ${date}`)
    return summary
  }

  async updateDailySummary(
    date: string,
    updates: Partial<BillPaymentDailySummary>
  ): Promise<BillPaymentDailySummary> {
    const index = this.summaries.findIndex(s => s.date === date)
    if (index === -1) throw new Error(`Summary for ${date} not found`)

    const existing = this.summaries[index]!
    const updated: BillPaymentDailySummary = {
      ...existing,
      ...updates,
      id: existing.id,
      date: existing.date,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    this.summaries[index] = updated
    await this.save()
    console.log(`✅ [bill-payment] Updated summary for ${date}`)
    return updated
  }

  // ─── Workflow Steps ───────────────────────────────────────────────────────────

  async completeStep1(
    date: string,
    userId: string,
    userName: string
  ): Promise<BillPaymentDailySummary> {
    let summary = await this.getDailySummary(date)
    if (!summary) summary = await this.createDailySummary(date)

    const txns = await this.getTransactionsByDate(date)
    const completedTxns = txns.filter(t => t.status === 'completed')
    const cancelledTxns = txns.filter(t => t.status === 'cancelled')

    return this.updateDailySummary(date, {
      workflowStatus: 'step2_completed', // temporarily; page decides step2 starts
      step1CompletedAt: new Date().toISOString(),
      step1CompletedBy: userId,
      step1CompletedByName: userName,
      step1TotalTransactions: txns.length,
      step1SuccessTransactions: completedTxns.length,
      step1FailedTransactions: cancelledTxns.length,
      step1TotalAmount: completedTxns.reduce((s, t) => s + t.amount, 0),
      step1TotalCommission: completedTxns.reduce((s, t) => s + (t.commission ?? 0), 0),
    })
  }

  async completeStep2(date: string, step2Data: any): Promise<BillPaymentDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) throw new Error(`Summary for ${date} not found`)

    const hasDiscrepancies =
      step2Data.step2ActualBillPaymentCash !== step2Data.step2ExpectedBillPaymentCash ||
      step2Data.step2ActualServiceFeeCash !== step2Data.step2ExpectedServiceFeeCash

    return this.updateDailySummary(date, {
      ...step2Data,
      step2CompletedAt: new Date().toISOString(),
      step2HasDiscrepancies: hasDiscrepancies,
      workflowStatus: hasDiscrepancies ? 'step2_completed_with_notes' : 'step2_completed',
    })
  }

  async submitAudit(date: string, auditData: any): Promise<BillPaymentDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) throw new Error(`Summary for ${date} not found`)

    const isCorrection = auditData.outcome === 'needs_correction'

    const updates: Partial<BillPaymentDailySummary> = {
      auditedAt: new Date().toISOString(),
      auditedBy: auditData.auditedBy,
      auditedByName: auditData.auditedByName,
      auditBankStatementAmount: auditData.auditBankStatementAmount,
      auditBankBalanceMatches: auditData.auditBankBalanceMatches,
      auditFindings: auditData.auditFindings,
      auditTransactionsVerified: auditData.auditTransactionsVerified,
      auditTransactionsWithIssues: auditData.auditTransactionsWithIssues,
      workflowStatus: isCorrection
        ? 'needs_correction'
        : auditData.auditTransactionsWithIssues > 0
          ? 'audited_with_issues'
          : 'audited',
    }

    // Approach C: on correction, clear Step 2 but preserve Step 1 and transactions
    if (isCorrection) {
      updates.needsCorrectionFrom = summary.workflowStatus
      updates.correctionNotes = auditData.correctionNotes
      updates.correctionRequestedAt = new Date().toISOString()
      updates.correctionRequestedBy = auditData.auditedBy
      // Clear Step 2 so manager must re-verify
      updates.step2CompletedAt = undefined
      updates.step2CompletedBy = undefined
      updates.step2CompletedByName = undefined
      updates.step2ExpectedBillPaymentCash = undefined
      updates.step2ActualBillPaymentCash = undefined
      updates.step2ExpectedServiceFeeCash = undefined
      updates.step2ActualServiceFeeCash = undefined
      updates.step2HasDiscrepancies = undefined
      updates.step2VerificationNotes = undefined
      // Clear previous audit record (fresh audit after correction)
      updates.auditedAt = undefined
      updates.auditedBy = undefined
      updates.auditedByName = undefined
      updates.auditFindings = undefined
    }

    return this.updateDailySummary(date, updates)
  }

  async submitOwnerApproval(date: string, approvalData: any): Promise<BillPaymentDailySummary> {
    const summary = await this.getDailySummary(date)
    if (!summary) throw new Error(`Summary for ${date} not found`)

    const isCorrection = approvalData.decision === 'needs_correction'
    const workflowStatus = isCorrection
      ? 'needs_correction'
      : approvalData.decision === 'approved_with_notes'
        ? 'approved_with_notes'
        : 'approved'

    const updates: Partial<BillPaymentDailySummary> = {
      approvedAt: new Date().toISOString(),
      approvedBy: approvalData.approvedBy,
      approvedByName: approvalData.approvedByName,
      approvalNotes: approvalData.approvalNotes,
      workflowStatus,
    }

    if (isCorrection) {
      updates.needsCorrectionFrom = summary.workflowStatus
      updates.correctionNotes = approvalData.approvalNotes
      updates.correctionRequestedAt = new Date().toISOString()
      updates.correctionRequestedBy = approvalData.approvedBy
      // Clear Step 2 so manager must re-verify
      updates.step2CompletedAt = undefined
      updates.step2CompletedBy = undefined
      updates.step2CompletedByName = undefined
      updates.step2ExpectedBillPaymentCash = undefined
      updates.step2ActualBillPaymentCash = undefined
      updates.step2ExpectedServiceFeeCash = undefined
      updates.step2ActualServiceFeeCash = undefined
      updates.step2HasDiscrepancies = undefined
      updates.step2VerificationNotes = undefined
      updates.auditedAt = undefined
      updates.auditedBy = undefined
      updates.auditedByName = undefined
      updates.auditFindings = undefined
      updates.approvedAt = undefined
      updates.approvedBy = undefined
      updates.approvedByName = undefined
    }

    return this.updateDailySummary(date, updates)
  }

  // ─── Favorites ───────────────────────────────────────────────────────────────

  async getFavorites(): Promise<BillPaymentFavorite[]> {
    return [...this.favorites].sort((a, b) => a.tab - b.tab || a.order - b.order)
  }

  async getFavoritesByTab(tab: 1 | 2 | 3 | 4 | 5): Promise<BillPaymentFavorite[]> {
    return this.favorites
      .filter(f => f.tab === tab)
      .sort((a, b) => a.order - b.order)
  }

  async addFavorite(data: Omit<BillPaymentFavorite, 'id' | 'createdAt'>): Promise<BillPaymentFavorite> {
    const tabItems = this.favorites.filter(f => f.tab === data.tab)
    if (tabItems.length >= 10) {
      throw new Error(`Tab #${data.tab} is full (max 10 favorites)`)
    }
    const newFav: BillPaymentFavorite = {
      ...data,
      id: `bpfav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    this.favorites.push(newFav)
    await this.save()
    return newFav
  }

  async updateFavorite(
    id: string,
    data: Partial<Omit<BillPaymentFavorite, 'id' | 'createdAt'>>
  ): Promise<BillPaymentFavorite> {
    const idx = this.favorites.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`Favorite ${id} not found`)
    this.favorites[idx] = { ...this.favorites[idx]!, ...data }
    await this.save()
    return this.favorites[idx]!
  }

  async deleteFavorite(id: string): Promise<void> {
    const idx = this.favorites.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`Favorite ${id} not found`)
    this.favorites.splice(idx, 1)
    await this.save()
  }
}

export const billPaymentJsonRepository = new BillPaymentJsonRepository()
