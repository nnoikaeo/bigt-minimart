import { salesJsonRepository } from '~/server/repositories/sales-json.repository'

/**
 * DELETE /api/daily-sales/[id]
 * 
 * Delete a daily sales entry
 * Uses Repository Pattern for flexible data source switching
 * 
 * Response: { success: boolean, message: string }
 */

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

    // Get existing entry to verify it exists
    const existingEntry = await salesJsonRepository.getById(id)

    if (!existingEntry) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Check ownership (basic check - can be extended with roles like admin)
    if (existingEntry.submittedBy !== user.uid) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this entry',
      })
    }

    // Delete via repository
    await salesJsonRepository.delete(id)

    return {
      success: true,
      message: 'Sales entry deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
