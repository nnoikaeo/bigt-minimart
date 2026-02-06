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
  expectedCash: z.number().nonnegative().optional(),
  expectedQR: z.number().nonnegative().optional(),
  expectedBank: z.number().nonnegative().optional(),
  expectedGovernment: z.number().nonnegative().optional(),
  posData: z.object({
    cash: z.number().nonnegative().optional(),
    qr: z.number().nonnegative().optional(),
    bank: z.number().nonnegative().optional(),
    government: z.number().nonnegative().optional(),
  }).optional(),
  differences: z.object({
    cashDiff: z.number().optional(),
    qrDiff: z.number().optional(),
    bankDiff: z.number().optional(),
    governmentDiff: z.number().optional(),
  }).optional(),
  cashReconciliation: z.object({
    expectedAmount: z.number().nonnegative().optional(),
    actualAmount: z.number().nonnegative().optional(),
    difference: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
  auditDetails: z.object({
    cashAuditNotes: z.string().optional(),
    qrAuditNotes: z.string().optional(),
    bankAuditNotes: z.string().optional(),
    governmentAuditNotes: z.string().optional(),
    recommendation: z.string().optional(),
  }).optional(),
  status: z.enum(['pending', 'approved']).optional(),
  submittedBy: z.string().optional(),
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

    // Get existing entry to verify it exists
    const existingEntry = await salesJsonRepository.getById(id)

    if (!existingEntry) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Prevent editing approved entries
    if (existingEntry.status === 'approved') {
      throw createError({
        statusCode: 400,
        message: 'Cannot edit approved entries',
      })
    }

    console.log('[PUT /api/daily-sales/[id]] Updating entry:', id)

    // Build partial update object
    const updateData: Partial<DailySalesEntry> = {}
    
    // Copy defined properties
    if (validatedData.date !== undefined) updateData.date = validatedData.date
    if (validatedData.cashierId !== undefined) updateData.cashierId = validatedData.cashierId
    if (validatedData.cashierName !== undefined) updateData.cashierName = validatedData.cashierName
    if (validatedData.expectedCash !== undefined) updateData.expectedCash = validatedData.expectedCash
    if (validatedData.expectedQR !== undefined) updateData.expectedQR = validatedData.expectedQR
    if (validatedData.expectedBank !== undefined) updateData.expectedBank = validatedData.expectedBank
    if (validatedData.expectedGovernment !== undefined) updateData.expectedGovernment = validatedData.expectedGovernment
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.submittedBy !== undefined) updateData.submittedBy = validatedData.submittedBy
    
    // Handle posData with defaults
    if (validatedData.posData) {
      updateData.posData = {
        cash: validatedData.posData.cash ?? existingEntry.posData.cash,
        qr: validatedData.posData.qr ?? existingEntry.posData.qr,
        bank: validatedData.posData.bank ?? existingEntry.posData.bank,
        government: validatedData.posData.government ?? existingEntry.posData.government,
      }
    }
    
    // Handle differences
    if (validatedData.differences !== undefined) {
      updateData.differences = {
        cashDiff: validatedData.differences.cashDiff ?? existingEntry.differences?.cashDiff ?? 0,
        qrDiff: validatedData.differences.qrDiff ?? existingEntry.differences?.qrDiff ?? 0,
        bankDiff: validatedData.differences.bankDiff ?? existingEntry.differences?.bankDiff ?? 0,
        governmentDiff: validatedData.differences.governmentDiff ?? existingEntry.differences?.governmentDiff ?? 0,
      } as DailySalesEntry['differences']
    }
    
    // Handle cashReconciliation
    if (validatedData.cashReconciliation) {
      const expectedAmount = validatedData.cashReconciliation.expectedAmount ?? existingEntry.cashReconciliation.expectedAmount
      const actualAmount = validatedData.cashReconciliation.actualAmount ?? existingEntry.cashReconciliation.actualAmount
      updateData.cashReconciliation = {
        expectedAmount,
        actualAmount,
        difference: actualAmount - expectedAmount,
        notes: validatedData.cashReconciliation.notes ?? existingEntry.cashReconciliation.notes,
      }
    }

    // Handle auditDetails
    if (validatedData.auditDetails !== undefined) {
      updateData.auditDetails = {
        cashAuditNotes: validatedData.auditDetails.cashAuditNotes ?? existingEntry.auditDetails?.cashAuditNotes ?? '',
        qrAuditNotes: validatedData.auditDetails.qrAuditNotes ?? existingEntry.auditDetails?.qrAuditNotes ?? '',
        bankAuditNotes: validatedData.auditDetails.bankAuditNotes ?? existingEntry.auditDetails?.bankAuditNotes ?? '',
        governmentAuditNotes: validatedData.auditDetails.governmentAuditNotes ?? existingEntry.auditDetails?.governmentAuditNotes ?? '',
        recommendation: validatedData.auditDetails.recommendation ?? existingEntry.auditDetails?.recommendation ?? '',
      } as DailySalesEntry['auditDetails']
    }

    // Recalculate total if posData changed
    if (validatedData.posData) {
      const posData = updateData.posData || existingEntry.posData
      updateData.total = posData.cash + posData.qr + posData.bank + posData.government
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
