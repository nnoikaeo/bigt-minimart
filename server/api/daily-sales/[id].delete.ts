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
    console.log('[DELETE /api/daily-sales/[id]] User context:', user)
    
    // For development, allow deletion without strict auth
    // In production, this should be enforced
    const userId = user?.uid || 'dev-user'
    console.log('[DELETE /api/daily-sales/[id]] Using user ID:', userId)

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

    console.log('[DELETE /api/daily-sales/[id]] Deleting entry:', id)

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
