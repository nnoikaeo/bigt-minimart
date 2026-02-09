import { z } from 'zod'
import { salesJsonRepository } from '~/server/repositories/sales-json.repository'
import type { DailySalesEntry } from '~/types/repositories'

/**
 * POST /api/daily-sales
 * 
 * Create a new daily sales entry
 * Uses Repository Pattern for flexible data source switching
 * 
 * Request body: DailySalesEntry (without id and timestamps)
 * Response: { success: boolean, data: DailySalesEntry }
 */

const createDailySalesSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  cashierId: z.string().min(1, 'Cashier ID is required'),
  cashierName: z.string().min(1, 'Cashier name is required'),
  expectedCash: z.number().nonnegative().default(0),
  expectedQR: z.number().nonnegative().default(0),
  expectedBank: z.number().nonnegative().default(0),
  expectedGovernment: z.number().nonnegative().default(0),
  posData: z.object({
    cash: z.number().nonnegative(),
    qr: z.number().nonnegative(),
    bank: z.number().nonnegative(),
    government: z.number().nonnegative(),
  }),
  differences: z.object({
    cashDiff: z.number().optional(),
    qrDiff: z.number().optional(),
    bankDiff: z.number().optional(),
    governmentDiff: z.number().optional(),
  }).optional(),
  cashReconciliation: z.object({
    expectedAmount: z.number().nonnegative(),
    actualAmount: z.number().nonnegative(),
    difference: z.number().optional(),
    notes: z.string().optional(),
  }),
  auditDetails: z.object({
    cashAuditNotes: z.string().optional(),
    qrAuditNotes: z.string().optional(),
    bankAuditNotes: z.string().optional(),
    governmentAuditNotes: z.string().optional(),
    recommendation: z.string().optional(),
  }).optional(),
  status: z.enum(['pending', 'approved']).default('pending'),
})

export default defineEventHandler(async (event) => {
  try {
    // Get user from context (set by auth middleware)
    const user = (event.context as any).user
    console.log('[POST /api/daily-sales] User context:', user)

    // For development, use fallback if no auth context
    // In production, this would require real authentication
    // Using Ve1ykzh3vFNKiPsUhw5HgK13H6r2 (owner) as fallback
    const userId = user?.uid || 'Ve1ykzh3vFNKiPsUhw5HgK13H6r2'
    console.log('[POST /api/daily-sales] Using user ID:', userId)

    // Initialize repository
    await salesJsonRepository.init()

    const body = await readBody(event)
    console.log('[POST /api/daily-sales] Request body:', body)
    
    const validatedData = createDailySalesSchema.parse(body)
    console.log('[POST /api/daily-sales] Validated data:', validatedData)

    // Calculate difference and total
    const difference =
      validatedData.cashReconciliation.actualAmount -
      validatedData.cashReconciliation.expectedAmount

    const total =
      validatedData.posData.cash +
      validatedData.posData.qr +
      validatedData.posData.bank +
      validatedData.posData.government

    // Create entry object with all required fields
    const entryData = {
      date: validatedData.date,
      cashierId: validatedData.cashierId,
      cashierName: validatedData.cashierName,
      expectedCash: validatedData.expectedCash,
      expectedQR: validatedData.expectedQR,
      expectedBank: validatedData.expectedBank,
      expectedGovernment: validatedData.expectedGovernment,
      posData: validatedData.posData,
      differences: validatedData.differences || {
        cashDiff: validatedData.posData.cash - validatedData.expectedCash,
        qrDiff: validatedData.posData.qr - validatedData.expectedQR,
        bankDiff: validatedData.posData.bank - validatedData.expectedBank,
        governmentDiff: validatedData.posData.government - validatedData.expectedGovernment,
      },
      cashReconciliation: {
        expectedAmount: validatedData.cashReconciliation.expectedAmount,
        actualAmount: validatedData.cashReconciliation.actualAmount,
        difference,
        notes: validatedData.cashReconciliation.notes || '',
      },
      auditDetails: validatedData.auditDetails || {
        cashAuditNotes: '',
        qrAuditNotes: '',
        bankAuditNotes: '',
        governmentAuditNotes: '',
        recommendation: '',
      },
      total,
      status: validatedData.status,
      submittedAt: new Date().toISOString(),
      submittedBy: userId,
      auditedAt: undefined,
      auditedBy: undefined,
      updatedAt: new Date().toISOString(),
    }

    // Add to repository
    const newEntry = await salesJsonRepository.add(entryData as Omit<DailySalesEntry, 'id'>)

    console.log('[POST /api/daily-sales] Entry created by repository:', newEntry)
    console.log('[POST /api/daily-sales] New entry has posData:', !!newEntry?.posData)
    console.log('[POST /api/daily-sales] New entry has cashierName:', !!newEntry?.cashierName)
    console.log('[POST /api/daily-sales] New entry keys:', Object.keys(newEntry || {}))

    setResponseStatus(event, 201)
    return {
      success: true,
      data: newEntry,
      message: 'Daily sales entry created successfully',
    }
  } catch (error: any) {
    console.error('[POST /api/daily-sales] Error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('[POST /api/daily-sales] Validation error:', error.issues)
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    
    if (error.statusCode) {
      throw error
    }
    
    console.error('[POST /api/daily-sales] Unexpected error:', error.message)
    throw createError({
      statusCode: 500,
      message: `Failed to create daily sales entry: ${error.message}`,
    })
  }
})
