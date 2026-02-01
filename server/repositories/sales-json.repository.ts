/**
 * JSON Repository Implementation
 * ✅ Used during development
 * 📝 Uses local JSON file for data storage
 * 🔄 Can be swapped with FirestoreRepository later without changing stores/components
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type { ISalesRepository, DailySalesEntry } from '~/types/repositories'

/**
 * JSON Repository for Daily Sales
 * - Loads/saves data from/to JSON file
 * - Perfect for development and testing
 * - Can be replaced with Firestore version later
 */
export class SalesJsonRepository implements ISalesRepository {
  private data: DailySalesEntry[] = []
  private dataFile: string

  constructor() {
    // Store data in public directory for easy access during development
    this.dataFile = join(process.cwd(), 'public', 'data', 'daily-sales.json')
  }

  /**
   * Initialize: Load data from JSON file
   * Called once on server startup
   */
  async init(): Promise<void> {
    try {
      const content = await fs.readFile(this.dataFile, 'utf-8')
      this.data = JSON.parse(content) as DailySalesEntry[]
      console.log(`✅ Loaded ${this.data.length} sales records from JSON`)
    } catch (error) {
      console.log('📝 No data file found, starting with empty data')
      this.data = []
      // Create directory if not exists
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
   * Save data to JSON file
   * Called after every write operation
   */
  private async save(): Promise<void> {
    try {
      await this.ensureDataDir()
      const json = JSON.stringify(this.data, null, 2)
      await fs.writeFile(this.dataFile, json, 'utf-8')
      console.log(`✅ Saved ${this.data.length} sales records to JSON`)
    } catch (error) {
      console.error('❌ Failed to save to JSON:', error)
      throw new Error('Failed to save sales data')
    }
  }

  /**
   * READ: Fetch sales with date range filter
   * @param startDate ISO format: YYYY-MM-DD
   * @param endDate ISO format: YYYY-MM-DD
   */
  async fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]> {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')

    return this.data.filter(sale => {
      const saleDate = new Date(sale.date + 'T00:00:00')
      return saleDate >= start && saleDate <= end
    })
  }

  /**
   * READ: Get single record by ID
   */
  async getById(id: string): Promise<DailySalesEntry> {
    const sale = this.data.find(s => s.id === id)
    if (!sale) {
      throw new Error(`Sale with ID ${id} not found`)
    }
    return sale
  }

  /**
   * READ: Get all records
   */
  async getAll(): Promise<DailySalesEntry[]> {
    return this.data
  }

  /**
   * READ: Filter by status
   */
  async getByStatus(status: 'submitted' | 'audited' | 'approved'): Promise<DailySalesEntry[]> {
    return this.data.filter(s => s.status === status)
  }

  /**
   * READ: Count total records
   */
  async count(): Promise<number> {
    return this.data.length
  }

  /**
   * WRITE: Add new sales record
   * - Generates unique ID
   * - Sets submittedAt timestamp
   * - Saves to JSON file
   */
  async add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry> {
    // Generate unique ID
    const id = `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Explicitly create newSale with all required fields
    const newSale: DailySalesEntry = {
      id: id,
      date: sale.date,
      cashierId: sale.cashierId,
      cashierName: sale.cashierName,
      expectedCash: sale.expectedCash ?? 0,
      expectedQR: sale.expectedQR ?? 0,
      expectedBank: sale.expectedBank ?? 0,
      expectedGovernment: sale.expectedGovernment ?? 0,
      posData: sale.posData,
      differences: sale.differences,
      cashReconciliation: sale.cashReconciliation,
      auditDetails: sale.auditDetails,
      total: sale.total,
      status: sale.status,
      submittedBy: sale.submittedBy,
      submittedAt: new Date().toISOString(),
      auditedAt: sale.auditedAt,
      auditedBy: sale.auditedBy,
      updatedAt: new Date().toISOString(),
    }

    console.log('[Repository.add] Creating sale with data:', newSale)

    // Validate data
    this.validateSale(newSale)

    // Add to in-memory data
    this.data.push(newSale)

    // Save to file
    await this.save()

    console.log(`✅ Added sale: ${id}`)
    console.log('[Repository.add] Returning to API:', newSale)
    return newSale
  }

  /**
   * WRITE: Update existing record
   * - Validates data
   * - Updates in-memory data
   * - Saves to JSON file
   * - Returns the updated entry
   */
  async update(id: string, updates: Partial<DailySalesEntry>): Promise<DailySalesEntry> {
    const index = this.data.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Sale with ID ${id} not found`)
    }

    // Get existing entry
    const existing = this.data[index]
    if (!existing) {
      throw new Error(`Sale with ID ${id} not found`)
    }

    // Merge updates, ensuring all required fields are preserved
    const updated: DailySalesEntry = {
      ...existing,
      ...updates,
      id: existing.id, // Always use original id
      date: updates.date ?? existing.date,
      cashierId: updates.cashierId ?? existing.cashierId,
      cashierName: updates.cashierName ?? existing.cashierName,
      expectedCash: updates.expectedCash ?? existing.expectedCash,
      expectedQR: updates.expectedQR ?? existing.expectedQR,
      expectedBank: updates.expectedBank ?? existing.expectedBank,
      expectedGovernment: updates.expectedGovernment ?? existing.expectedGovernment,
      posData: updates.posData ?? existing.posData,
      differences: updates.differences ?? existing.differences,
      cashReconciliation: updates.cashReconciliation ?? existing.cashReconciliation,
      auditDetails: updates.auditDetails ?? existing.auditDetails,
      total: updates.total ?? existing.total,
      status: updates.status ?? existing.status,
      submittedBy: updates.submittedBy ?? existing.submittedBy,
      submittedAt: existing.submittedAt, // Never update
      auditedAt: updates.auditedAt ?? existing.auditedAt,
      auditedBy: updates.auditedBy ?? existing.auditedBy,
      updatedAt: new Date().toISOString(),
    }

    // Validate merged data
    this.validateSale(updated)

    // Update in-memory data
    this.data[index] = updated

    // Save to file
    await this.save()

    console.log(`✅ Updated sale: ${id}`)
    console.log('[Repository.update] Returning updated entry:', updated)
    return updated
  }

  /**
   * WRITE: Delete record
   * - Removes from in-memory data
   * - Saves to JSON file
   */
  async delete(id: string): Promise<void> {
    const index = this.data.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Sale with ID ${id} not found`)
    }

    // Remove from in-memory data
    this.data.splice(index, 1)

    // Save to file
    await this.save()

    console.log(`✅ Deleted sale: ${id}`)
  }

  /**
   * Validate sale data
   * Throws error if data is invalid
   */
  private validateSale(sale: DailySalesEntry): void {
    if (!sale.date) throw new Error('Date is required')
    if (!sale.cashierId) throw new Error('Cashier ID is required')
    if (!sale.cashierName) throw new Error('Cashier name is required')
    if (!sale.posData) throw new Error('posData is required')

    const total = sale.posData.cash + sale.posData.qr + 
                  sale.posData.bank + sale.posData.government

    if (total < 0) throw new Error('Total sales cannot be negative')
    if (sale.cashReconciliation && sale.cashReconciliation.actualAmount < 0) {
      throw new Error('Actual cash cannot be negative')
    }
  }
}

/**
 * Export singleton instance
 * Used throughout the application
 */
export const salesJsonRepository = new SalesJsonRepository()
