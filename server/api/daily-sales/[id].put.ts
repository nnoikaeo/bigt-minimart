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
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Please login',
      })
    }

    // Initialize repository
    await salesJsonRepository.init()

    const body = await readBody(event)
    const validatedData = updateDailySalesSchema.parse(body)

    // Get existing entry to verify it exists
    const existingEntry = await salesJsonRepository.getById(id)

    if (!existingEntry) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Check ownership (basic check - can be extended with roles)
    if (existingEntry.submittedBy !== user.uid) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this entry',
      })
    }

    // Build partial update object
    const updateData: Partial<DailySalesEntry> = {
      ...validatedData,
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

    return {
      success: true,
      data: updatedEntry,
      message: 'Sales entry updated successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
