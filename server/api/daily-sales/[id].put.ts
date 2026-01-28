import { z } from 'zod'
import { salesJsonRepository } from '~/server/repositories/sales-json.repository'
import type { DailySalesEntry } from '~/types/repositories'

/**
 * PUT /api/daily-sales/[id]
 * 
 * Update an existing daily sales entry
 * Uses Repository Pattern for flexible data source switching
 * 
 * Request body: Partial<DailySalesEntry> (optional fields)
 * Response: { success: boolean, data: DailySalesEntry }
 */

const updateDailySalesSchema = z.object({
  date: z.string().optional(),
  cashierId: z.string().optional(),
  cashierName: z.string().optional(),
  posposData: z.object({
    cash: z.number().nonnegative().optional(),
    qr: z.number().nonnegative().optional(),
    bank: z.number().nonnegative().optional(),
    government: z.number().nonnegative().optional(),
  }).optional(),
  cashReconciliation: z.object({
    expectedAmount: z.number().nonnegative().optional(),
    actualAmount: z.number().nonnegative().optional(),
    difference: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
  status: z.enum(['submitted', 'audited', 'approved']).optional(),
  auditNotes: z.string().optional(),
  submittedBy: z.string().optional(), // Allow submittedBy from client
}).strict()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing sales entry ID',
    })
  }

  try {
    const user = (event.context as any).user
    console.log('[PUT /api/daily-sales/[id]] User context:', user)
    
    // For development, allow updates without strict auth
    // In production, this should be enforced
    const userId = user?.uid || 'dev-user'
    console.log('[PUT /api/daily-sales/[id]] Using user ID:', userId)

    // Initialize repository
    await salesJsonRepository.init()

    const body = await readBody(event)
    console.log('[PUT /api/daily-sales/[id]] Request body:', body)
    
    const validatedData = updateDailySalesSchema.parse(body)
    
    // Ensure posposData properties are numbers with defaults
    if (validatedData.posposData) {
      validatedData.posposData = {
        cash: validatedData.posposData.cash ?? 0,
        qr: validatedData.posposData.qr ?? 0,
        bank: validatedData.posposData.bank ?? 0,
        government: validatedData.posposData.government ?? 0,
      }
    }

    // Get existing entry to verify it exists
    const existingEntry = await salesJsonRepository.getById(id)

    if (!existingEntry) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    console.log('[PUT /api/daily-sales/[id]] Updating entry:', id)

    // Build partial update object with safe property access
    const updateData: Partial<DailySalesEntry> = {}
    
    // Only add properties that are defined
    if (validatedData.date !== undefined) updateData.date = validatedData.date
    if (validatedData.cashierId !== undefined) updateData.cashierId = validatedData.cashierId
    if (validatedData.cashierName !== undefined) updateData.cashierName = validatedData.cashierName
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.submittedBy !== undefined) updateData.submittedBy = validatedData.submittedBy
    if (validatedData.auditNotes !== undefined) updateData.auditNotes = validatedData.auditNotes
    
    // Handle posposData with defaults
    if (validatedData.posposData) {
      updateData.posposData = {
        cash: validatedData.posposData.cash ?? 0,
        qr: validatedData.posposData.qr ?? 0,
        bank: validatedData.posposData.bank ?? 0,
        government: validatedData.posposData.government ?? 0,
      }
    }
    
    // Handle cashReconciliation
    if (validatedData.cashReconciliation) {
      updateData.cashReconciliation = {
        expectedAmount: validatedData.cashReconciliation.expectedAmount ?? 0,
        actualAmount: validatedData.cashReconciliation.actualAmount ?? 0,
        difference: validatedData.cashReconciliation.difference ?? 0,
        notes: validatedData.cashReconciliation.notes ?? '',
      }
    }

    // Recalculate difference and total if reconciliation data changed
    if (validatedData.cashReconciliation) {
      const expectedAmount = validatedData.cashReconciliation.expectedAmount ?? existingEntry.cashReconciliation.expectedAmount
      const actualAmount = validatedData.cashReconciliation.actualAmount ?? existingEntry.cashReconciliation.actualAmount
      updateData.cashReconciliation = {
        ...existingEntry.cashReconciliation,
        ...validatedData.cashReconciliation,
        difference: actualAmount - expectedAmount,
      }
    }

    // Recalculate total if posposData changed
    if (validatedData.posposData) {
      const posposData = {
        ...existingEntry.posposData,
        ...validatedData.posposData,
      }
      updateData.total = posposData.cash + posposData.qr + posposData.bank + posposData.government
    }

    // Update via repository
    const updatedEntry = await salesJsonRepository.update(id, updateData)

    console.log('[PUT /api/daily-sales/[id]] Updated entry from repository:', updatedEntry)

    return {
      success: true,
      data: updatedEntry,
      message: 'Sales entry updated successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[PUT /api/daily-sales/[id]] Validation error:', error.issues)
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    if (error.statusCode) {
      throw error
    }
    console.error('[PUT /api/daily-sales/[id]] Error updating sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
