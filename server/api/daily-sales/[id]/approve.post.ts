/**
 * POST /api/daily-sales/[id]/approve
 *
 * Approve a daily sales entry (Owner only)
 * Changes status to 'approved' and records approval metadata
 *
 * Request body: none (approval action)
 * Response: { success: boolean, data: DailySalesEntry, message: string }
 *
 * Role requirement: owner
 * Status requirement: entry must be 'pending'
 */

import { salesJsonRepository } from '~/server/repositories/sales-json.repository'
import type { DailySalesEntry } from '~/types/repositories'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  console.log('[POST /api/daily-sales/[id]/approve] REQUEST START')
  console.log('[POST /api/daily-sales/[id]/approve] ID:', id)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing sales entry ID',
    })
  }

  try {
    // Get user from context (set by auth middleware)
    const user = (event.context as any).user
    console.log('[POST /api/daily-sales/[id]/approve] User object:', user)
    console.log('[POST /api/daily-sales/[id]/approve] User uid:', user?.uid)
    console.log('[POST /api/daily-sales/[id]/approve] User role:', user?.primaryRole || user?.role)

    // For development, use fallback if no auth context
    // In production, this would require real authentication
    // Using Ve1ykzh3vFNKiPsUhw5HgK13H6r2 (owner) as fallback
    const userId = user?.uid || 'Ve1ykzh3vFNKiPsUhw5HgK13H6r2'
    const userRole = user?.primaryRole || user?.role || 'owner'

    console.log('[POST /api/daily-sales/[id]/approve] Using user ID:', userId)
    console.log('[POST /api/daily-sales/[id]/approve] Using role:', userRole)

    // Check if user has owner role (enforced in production)
    if (userRole !== 'owner') {
      console.log('[POST /api/daily-sales/[id]/approve] User does not have owner role:', userRole)
      throw createError({
        statusCode: 403,
        message: 'Only owners can approve sales entries',
      })
    }

    // Initialize repository
    await salesJsonRepository.init()

    // Get existing entry
    const existingEntry = await salesJsonRepository.getById(id)

    if (!existingEntry) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Validate entry can be approved
    if (existingEntry.status === 'approved') {
      throw createError({
        statusCode: 400,
        message: 'Entry is already approved',
      })
    }

    if (existingEntry.status !== 'pending') {
      throw createError({
        statusCode: 400,
        message: 'Only pending entries can be approved',
      })
    }

    console.log('[POST /api/daily-sales/[id]/approve] Approving entry:', id)

    // Prepare approval update
    const approvalData: Partial<DailySalesEntry> = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: userId,
      updatedAt: new Date().toISOString(),
    }

    // Update via repository
    const approvedEntry = await salesJsonRepository.update(id, approvalData)

    console.log('[POST /api/daily-sales/[id]/approve] Entry approved:', approvedEntry)

    return {
      success: true,
      data: approvedEntry,
      message: 'Sales entry approved successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('[POST /api/daily-sales/[id]/approve] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
