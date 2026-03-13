/**
 * Repository Pattern - Data Abstraction Layer
 * 
 * Purpose: Abstract data source (JSON/Firestore) from business logic
 * Benefits: 
 *   - Easy to switch between JSON and Firestore
 *   - Same interface for both implementations
 *   - Stores and components don't care about data source
 *   - Testing becomes easier
 */

/**
 * Daily Sales Entry Interface
 * Structure matches both JSON and Firestore schema
 */
export interface DailySalesEntry {
  id: string
  date: string // ISO format: YYYY-MM-DD
  cashierId: string
  cashierName: string
  
  // Expected amounts per channel (from POS receipt)
  expectedCash: number // เงินสดคาดไว้
  expectedQR: number // QR Code คาดไว้
  expectedBank: number // ธนาคารคาดไว้
  expectedGovernment: number // โครงการรัฐคาดไว้
  
  // Sales data from POS (actual amounts)
  posData: {
    cash: number // เงินสด (จริง)
    qr: number // QR Code (จริง)
    bank: number // ธนาคาร (จริง)
    government: number // โครงการรัฐ (จริง)
  }
  
  // Per-channel differences (auto-calculated)
  differences: {
    cashDiff: number // เงินสด ผลต่าง
    qrDiff: number // QR Code ผลต่าง
    bankDiff: number // ธนาคาร ผลต่าง
    governmentDiff: number // โครงการรัฐ ผลต่าง
  }
  
  // Cash reconciliation (summary)
  cashReconciliation: {
    expectedAmount: number // เงินคาดไว้รวม (auto)
    actualAmount: number // เงินจริงรวม (auto)
    difference: number // ผลต่างรวม (auto)
    notes?: string // หมายเหตุสั้น
  }
  
  // Detailed audit findings - per-channel
  auditDetails?: {
    cashAuditNotes: string // วิเคราะห์สาเหตุ (เงินสด)
    qrAuditNotes: string // วิเคราะห์สาเหตุ (QR Code)
    bankAuditNotes: string // วิเคราะห์สาเหตุ (ธนาคาร)
    governmentAuditNotes: string // วิเคราะห์สาเหตุ (โครงการรัฐ)
  }
  
  // Calculated fields
  total?: number // Auto-calculated total (cash + qr + bank + government)
  
  // Status & workflow
  status: 'pending' | 'approved'
  auditNotes?: string

  // User & timestamps
  submittedAt: string | Date // ISO format or Date object
  submittedBy?: string
  auditedAt?: string | Date // ISO format or Date object
  auditedBy?: string
  approvedAt?: string | Date // ISO format or Date object (when owner approved)
  approvedBy?: string // Owner user ID who approved (lookup displayName from access-control store)

  // System timestamps
  createdAt?: string | Date
  updatedAt?: string | Date
}

/**
 * Sales Repository Interface
 * Defines contract that both JSON and Firestore repos must implement
 */
export interface ISalesRepository {
  /**
   * Initialize repository (e.g., load from file)
   */
  init(): Promise<void>

  /**
   * Fetch sales records with date range filter
   */
  fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]>

  /**
   * Get single sales record by ID
   */
  getById(id: string): Promise<DailySalesEntry>

  /**
   * Add new sales record
   * Returns: Record with auto-generated ID
   */
  add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry>

  /**
   * Update existing sales record
   * Returns: Updated record
   */
  update(id: string, updates: Partial<DailySalesEntry>): Promise<DailySalesEntry>

  /**
   * Delete sales record
   */
  delete(id: string): Promise<void>

  /**
   * Get all records (for admin/analytics)
   */
  getAll(): Promise<DailySalesEntry[]>

  /**
   * Filter by status
   */
  getByStatus(status: 'pending' | 'approved'): Promise<DailySalesEntry[]>

  /**
   * Count total records
   */
  count(): Promise<number>
}

/**
 * Expense Entry Interface (for future Finance store)
 */
export interface ExpenseEntry {
  id: string
  date: string
  category: string // rent, electricity, salary, supplies, other
  description: string
  amount: number
  notes?: string
  createdAt: Date
  createdBy: string
}

/**
 * Expense Repository Interface (for future)
 */
export interface IExpenseRepository {
  init(): Promise<void>
  fetch(startDate: string, endDate: string): Promise<ExpenseEntry[]>
  getById(id: string): Promise<ExpenseEntry>
  add(expense: Omit<ExpenseEntry, 'id' | 'createdAt'>): Promise<ExpenseEntry>
  update(id: string, updates: Partial<ExpenseEntry>): Promise<void>
  delete(id: string): Promise<void>
}

/**
 * User Entry Interface (for future Users store)
 */
export interface UserEntry {
  uid: string
  email: string
  displayName: string
  role: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
  isActive: boolean
  createdAt: Date
  createdBy?: string
}

/**
 * User Repository Interface (for future)
 */
export interface IUserRepository {
  init(): Promise<void>
  getAll(): Promise<UserEntry[]>
  getById(uid: string): Promise<UserEntry>
  add(user: Omit<UserEntry, 'createdAt'>): Promise<UserEntry>
  update(uid: string, updates: Partial<UserEntry>): Promise<void>
  delete(uid: string): Promise<void>
  getByRole(role: string): Promise<UserEntry[]>
}

/**
 * Money Transfer Transaction Interface
 * Main transaction ledger for Money Transfer Service
 * Supports 3 transaction types: Transfer, Withdrawal, Owner Deposit
 * Supports 3 channels: PromptPay (with 2 identifier types), Bank, Other
 */
export interface MoneyTransferTransaction {
  // Identity
  id: string // Format: "mts-{timestamp}-{random}"
  date: string // ISO format: "YYYY-MM-DD"
  datetime: string | Date // ISO format with time

  // Classification
  transactionType: 'transfer' | 'withdrawal' | 'owner_deposit'

  // Channel (conditional - only for transfer/withdrawal)
  channel?: 'promptpay' | 'bank' | 'other'

  // PromptPay specific fields (when channel === 'promptpay')
  promptpayIdentifierType?: 'phone' | 'id_card'
  promptpayIdentifier?: string // Phone: xxx-xxx-xxxx, ID Card: x-xxxx-xxxxx-xx-x
  promptpayAccountName?: string

  // Bank/Other specific fields (when channel === 'bank' or 'other')
  bankName?: string // Bank name (e.g., 'ธนาคารกสิกรไทย (KBank)')
  accountNumber?: string
  accountName?: string

  // Financial data
  amount: number // Transaction amount in บาท
  commission?: number // Service fee collected
  commissionType?: 'cash' | 'transfer' // How commission was received
  customerName?: string // Optional customer identifier

  // Balance snapshots (critical for audit trail)
  balanceImpact: {
    bankAccountBefore: number
    bankAccountAfter: number
    transferCashBefore: number
    transferCashAfter: number
    serviceFeeBeforeCash: number
    serviceFeeAfterCash: number
    serviceFeeBeforeTransfer: number
    serviceFeeAfterTransfer: number
  }

  // Status & workflow
  status: 'draft' | 'completed' | 'failed' | 'cancelled'
  draftReason?: string // Reason why transaction is draft (e.g., insufficient balance)
  verificationStatus?: 'pending' | 'verified' | 'audited' | 'approved'

  // Notes and metadata
  notes?: string

  // User tracking (denormalized for performance)
  recordedBy: string // Firebase UID
  recordedByName: string // Display name (denormalized)

  // Timestamps
  createdAt: string | Date
  updatedAt: string | Date
  completedAt?: string | Date // When draft became completed
}

/**
 * Money Transfer Daily Summary Interface
 * Aggregates per-day data for 3-step workflow
 * Tracks: Step 1 (Manager recording), Step 2 (Manager verification)
 *         Workflow 2.2 (Auditor review), Workflow 2.3 (Owner approval)
 */
export interface MoneyTransferDailySummary {
  // Identity
  id: string // Format: "mtsum-{date}" (e.g., "mtsum-2026-01-29")
  date: string // ISO format: "YYYY-MM-DD"

  // Step 1: Manager transaction recording
  step1: {
    status: 'in_progress' | 'completed'
    completedAt?: string | Date
    completedBy?: string // User ID
    completedByName?: string // Denormalized user name
    totalTransactions: number
    completedTransactions: number
    draftTransactions: number
    failedTransactions?: number
    totalAmount: number
    totalCommission: number
    finalBalances?: {
      bankAccount: number
      transferCash: number
      serviceFeeTransfer: number
      serviceFeeCash: number
    }
  }

  // Step 2: Manager cash verification
  step2?: {
    status: 'pending' | 'completed'
    completedAt?: string | Date
    completedBy?: string
    completedByName?: string
    expectedCash: {
      transferWithdrawal: number
      serviceFee: number
      total: number
    }
    actualCash: {
      transferWithdrawal: number
      serviceFee: number
      total: number
    }
    differences: {
      transferWithdrawal: number
      serviceFee: number
      total: number
    }
    verificationNotes?: string
    hasDiscrepancies: boolean
  }

  // Workflow 2.2: Auditor verification
  auditorVerification?: {
    status: 'pending' | 'completed' | 'issues_found'
    completedAt?: string | Date
    completedBy?: string // Auditor UID
    completedByName?: string
    transactionsVerified: number
    transactionsWithIssues: number
    bankStatementVerified: boolean
    bankStatementAmount?: number
    bankBalanceMatches: boolean
    auditorCash?: {
      transferWithdrawal: number
      serviceFee: number
      total: number
    }
    auditorCashMatches?: boolean // true when auditorCash totals match manager step2 totals
    // Bank reconciliation (for explaining D discrepancies)
    reconciliationItems?: Array<{ name: string; amount: number }>
    adjustedBankBalance?: number // closingBalance + sum(reconciliationItems)
    bankBalanceReconciled?: boolean // true when adjustedBankBalance matches bankStatementAmount
    auditNotes: string
    issuesFound?: string[]
    auditResult: 'no_issues' | 'minor_issues' | 'major_issues'
    txnIssueStatus?: Record<string, true>
  }

  // Workflow 2.3: Owner approval
  ownerApproval?: {
    status: 'pending' | 'approved' | 'approved_with_notes' | 'correction_requested'
    completedAt?: string | Date
    completedBy?: string // Owner UID
    completedByName?: string
    decision: 'approve' | 'approve_with_notes' | 'request_correction'
    ownerNotes?: string
  }

  // Overall workflow status
  workflowStatus: 'step1_in_progress' | 'step1_completed' | 'step2_completed' | 'audited' | 'approved' | 'needs_correction'

  // System timestamps
  createdAt?: string | Date
  updatedAt?: string | Date
}

/**
 * Money Transfer Balance Interface
 * Real-time balance tracking (updated atomically with each transaction)
 */
export interface MoneyTransferBalance {
  id: string // Format: "mtbal-{date}" (e.g., "mtbal-2026-01-29")
  date: string // ISO format: "YYYY-MM-DD"

  // Current balances (updated in real-time)
  bankAccount: number
  transferCash: number // Cash held for transfers/withdrawals
  serviceFeeTransfer: number // Commission received via transfer
  serviceFeeCash: number // Commission received in cash

  // Audit trail - history of all balance changes
  history?: Array<{
    transactionId: string
    timestamp: string | Date
    type: 'transfer' | 'withdrawal' | 'owner_deposit'
    balancesBefore: {
      bankAccount: number
      transferCash: number
      serviceFeeTransfer: number
      serviceFeeCash: number
    }
    balancesAfter: {
      bankAccount: number
      transferCash: number
      serviceFeeTransfer: number
      serviceFeeCash: number
    }
  }>

  // Opening balance (set manually at start of day)
  openingBalance?: number                          // bankAccount amount at start of day
  openingBalanceSetAt?: string                     // ISO timestamp when set
  openingBalanceSource?: 'carryover' | 'manual'   // How it was set
  openingBalanceSetBy?: string                     // User who set it

  // Last update tracking
  updatedAt?: string | Date
  updatedBy?: string
}

/**
 * Money Transfer Repository Interface
 * Defines contract for Money Transfer Service data access layer
 */
export interface IMoneyTransferRepository {
  // Initialization
  init(): Promise<void>

  // Transaction CRUD
  getTransaction(id: string): Promise<MoneyTransferTransaction>
  getTransactionsByDate(date: string): Promise<MoneyTransferTransaction[]>
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<MoneyTransferTransaction[]>
  getTransactionsByStatus(status: MoneyTransferTransaction['status']): Promise<MoneyTransferTransaction[]>
  getDraftTransactions(date: string): Promise<MoneyTransferTransaction[]>
  addTransaction(transaction: Omit<MoneyTransferTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<MoneyTransferTransaction>
  updateTransaction(id: string, updates: Partial<MoneyTransferTransaction>): Promise<MoneyTransferTransaction>
  deleteTransaction(id: string): Promise<void>

  // Complete draft transaction
  completeDraftTransaction(id: string, updates: Partial<MoneyTransferTransaction>): Promise<MoneyTransferTransaction>

  // Daily summary CRUD
  getAllSummaries(): Promise<MoneyTransferDailySummary[]>
  getDailySummary(date: string): Promise<MoneyTransferDailySummary | null>
  createDailySummary(date: string): Promise<MoneyTransferDailySummary>
  updateDailySummary(date: string, updates: Partial<MoneyTransferDailySummary>): Promise<MoneyTransferDailySummary>

  // Balance operations
  getCurrentBalance(date: string): Promise<MoneyTransferBalance>
  initializeBalance(date: string): Promise<MoneyTransferBalance>
  updateBalance(date: string, updates: Partial<MoneyTransferBalance>): Promise<MoneyTransferBalance>
  setOpeningBalance(date: string, amount: number, source: 'carryover' | 'manual', userId?: string): Promise<MoneyTransferBalance>
  getPreviousDayBalance(date: string): Promise<MoneyTransferBalance | null>

  // Workflow operations
  completeStep1(date: string, userId: string, userName: string): Promise<MoneyTransferDailySummary>
  completeStep2(date: string, step2Data: MoneyTransferDailySummary['step2']): Promise<MoneyTransferDailySummary>
  completeAudit(date: string, auditData: MoneyTransferDailySummary['auditorVerification']): Promise<MoneyTransferDailySummary>
  approveByOwner(date: string, approvalData: MoneyTransferDailySummary['ownerApproval']): Promise<MoneyTransferDailySummary>

  // Favorites CRUD
  getFavorites(): Promise<FavoriteTransfer[]>
  getFavoritesByTab(tab: 1 | 2 | 3 | 4 | 5): Promise<FavoriteTransfer[]>
  addFavorite(data: Omit<FavoriteTransfer, 'id' | 'createdAt'>): Promise<FavoriteTransfer>
  updateFavorite(id: string, updates: Partial<Omit<FavoriteTransfer, 'id' | 'createdAt'>>): Promise<FavoriteTransfer>
  deleteFavorite(id: string): Promise<void>

  // Statistics
  getTransactionCount(date: string): Promise<number>
  getTransactionCountByStatus(date: string, status: string): Promise<number>
}

/**
 * Favorite Transfer destination
 * Stored per tab (1–5), up to 10 per tab
 */
export interface FavoriteTransfer {
  id: string
  tab: 1 | 2 | 3 | 4 | 5
  order: number                              // 1–10 within the tab
  name: string                               // Display name
  channel: 'promptpay' | 'bank'
  identifier: string                         // Phone / ID / account number
  identifierType?: 'phone' | 'idcard' | 'promptpay' | 'account'
  bankName?: string                          // Bank name (when channel = 'bank')
  createdAt: string                          // ISO timestamp
}
