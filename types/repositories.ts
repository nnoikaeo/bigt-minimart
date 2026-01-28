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
  
  // Sales data from POSPOS
  posposData: {
    cash: number // เงินสด
    qr: number // QR Code
    bank: number // ธนาคาร
    government: number // โครงการรัฐ
  }
  
  // Cash reconciliation
  cashReconciliation: {
    expectedAmount: number // เงินคาดไว้
    actualCashInDrawer: number // เงินจริง
    difference: number // ผลต่าง (AUTO)
    notes?: string // หมายเหตุ
  }
  
  // Status & workflow
  status: 'submitted' | 'audited' | 'approved'
  auditNotes?: string
  
  // User & timestamps
  submittedAt: Date
  submittedBy?: string
  auditedAt?: Date
  auditedBy?: string
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
   */
  update(id: string, updates: Partial<DailySalesEntry>): Promise<void>

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
  getByStatus(status: 'submitted' | 'audited' | 'approved'): Promise<DailySalesEntry[]>

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
