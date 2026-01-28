/**
 * Firestore Repository Implementation
 * ⏳ Used in production (Phase 2+)
 * 🔥 Uses Firebase Firestore for data storage
 * 🔄 Drop-in replacement for SalesJsonRepository
 * 
 * To migrate from JSON to Firestore:
 * 1. Create SalesFirestoreRepository
 * 2. Change import in stores/sales.ts (1 line change)
 * 3. Keep everything else the same!
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { ISalesRepository, DailySalesEntry } from '~/types/repositories'

/**
 * Firestore Repository for Daily Sales
 * - Reads/writes data from/to Firestore
 * - Same interface as SalesJsonRepository
 * - Perfect for production with scaling needs
 */
export class SalesFirestoreRepository implements ISalesRepository {
  private db: Firestore
  private collectionName = 'daily_sales'

  constructor(db: Firestore) {
    this.db = db
  }

  /**
   * Initialize repository
   * In Firestore, this just validates connection
   */
  async init(): Promise<void> {
    try {
      // Test connection by getting one document
      const q = query(collection(this.db, this.collectionName))
      await getDocs(q)
      console.log('✅ Firestore connection verified')
    } catch (error) {
      console.error('❌ Firestore connection failed:', error)
      throw new Error('Failed to connect to Firestore')
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

    const q = query(
      collection(this.db, this.collectionName),
      where('date', '>=', start),
      where('date', '<=', end)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: (doc.data().submittedAt as Timestamp).toDate(),
      auditedAt: doc.data().auditedAt ? (doc.data().auditedAt as Timestamp).toDate() : undefined,
    })) as DailySalesEntry[]
  }

  /**
   * READ: Get single record by ID
   */
  async getById(id: string): Promise<DailySalesEntry> {
    const docRef = doc(this.db, this.collectionName, id)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      throw new Error(`Sale with ID ${id} not found`)
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
      submittedAt: (snapshot.data().submittedAt as Timestamp).toDate(),
      auditedAt: snapshot.data().auditedAt 
        ? (snapshot.data().auditedAt as Timestamp).toDate() 
        : undefined,
    } as DailySalesEntry
  }

  /**
   * READ: Get all records (use with caution in production!)
   */
  async getAll(): Promise<DailySalesEntry[]> {
    const q = query(collection(this.db, this.collectionName))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: (doc.data().submittedAt as Timestamp).toDate(),
      auditedAt: doc.data().auditedAt ? (doc.data().auditedAt as Timestamp).toDate() : undefined,
    })) as DailySalesEntry[]
  }

  /**
   * READ: Filter by status
   */
  async getByStatus(status: 'submitted' | 'audited' | 'approved'): Promise<DailySalesEntry[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('status', '==', status)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: (doc.data().submittedAt as Timestamp).toDate(),
      auditedAt: doc.data().auditedAt ? (doc.data().auditedAt as Timestamp).toDate() : undefined,
    })) as DailySalesEntry[]
  }

  /**
   * READ: Count total records
   */
  async count(): Promise<number> {
    const q = query(collection(this.db, this.collectionName))
    const snapshot = await getDocs(q)
    return snapshot.size
  }

  /**
   * WRITE: Add new sales record
   * - Generates ID on Firestore side
   * - Sets submittedAt timestamp
   * - Saves to Firestore
   */
  async add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry> {
    // Prepare data for Firestore
    const docData = {
      ...sale,
      date: new Date(sale.date),
      submittedAt: Timestamp.now(),
    }

    // Validate data
    this.validateSale({ ...docData, id: '' } as DailySalesEntry)

    // Add to Firestore
    const docRef = await addDoc(collection(this.db, this.collectionName), docData)

    console.log(`✅ Added sale: ${docRef.id}`)

    return {
      id: docRef.id,
      ...sale,
      submittedAt: new Date(),
    }
  }

  /**
   * WRITE: Update existing record
   */
  async update(id: string, updates: Partial<DailySalesEntry>): Promise<void> {
    // Remove id from updates if present
    const { id: _, ...cleanUpdates } = updates

    // Convert dates to Timestamps if present
    const firestoreUpdates: any = { ...cleanUpdates }
    if (cleanUpdates.submittedAt) {
      firestoreUpdates.submittedAt = Timestamp.fromDate(new Date(cleanUpdates.submittedAt))
    }
    if (cleanUpdates.auditedAt) {
      firestoreUpdates.auditedAt = Timestamp.fromDate(new Date(cleanUpdates.auditedAt))
    }
    if (cleanUpdates.date) {
      firestoreUpdates.date = new Date(cleanUpdates.date)
    }

    const docRef = doc(this.db, this.collectionName, id)
    await updateDoc(docRef, firestoreUpdates)

    console.log(`✅ Updated sale: ${id}`)
  }

  /**
   * WRITE: Delete record
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id)
    await deleteDoc(docRef)

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

    const total = sale.posposData.cash + sale.posposData.qr + 
                  sale.posposData.bank + sale.posposData.government

    if (total < 0) throw new Error('Total sales cannot be negative')
    if (sale.cashReconciliation.actualCashInDrawer < 0) {
      throw new Error('Actual cash cannot be negative')
    }
  }
}

/**
 * Factory function to create repository instance
 * Usage: const repo = createSalesFirestoreRepository(db)
 */
export function createSalesFirestoreRepository(db: Firestore): SalesFirestoreRepository {
  return new SalesFirestoreRepository(db)
}
