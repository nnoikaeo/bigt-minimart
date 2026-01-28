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
  posposData: z.object({
    cash: z.number().nonnegative(),
    qr: z.number().nonnegative(),
    bank: z.number().nonnegative(),
    government: z.number().nonnegative(),
  }),
  cashReconciliation: z.object({
    expectedAmount: z.number().nonnegative(),
    actualAmount: z.number().nonnegative(),
    difference: z.number().optional(),
    notes: z.string().optional(),
  }),
  status: z.enum(['submitted', 'audited', 'approved']).default('submitted'),
  auditNotes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Get user from context (optional for now - will be enforced in production)
    const user = (event.context as any).user
    console.log('[POST /api/daily-sales] User context:', user)
    
    // For now, use a fallback user ID for development
    const userId = user?.uid || 'dev-user-' + Date.now()
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
      validatedData.posposData.cash +
      validatedData.posposData.qr +
      validatedData.posposData.bank +
      validatedData.posposData.government

    // Create entry object
    const entryData = {
      ...validatedData,
      cashReconciliation: {
        ...validatedData.cashReconciliation,
        difference,
      },
      total,
      submittedAt: new Date().toISOString(),
      submittedBy: userId,
    }

    // Add to repository
    const newEntry = await salesJsonRepository.add(entryData as Omit<DailySalesEntry, 'id'>)

    console.log('[POST /api/daily-sales] Entry created by repository:', newEntry)
    console.log('[POST /api/daily-sales] New entry has posposData:', !!newEntry?.posposData)
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
