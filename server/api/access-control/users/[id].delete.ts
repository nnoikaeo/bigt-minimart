/**
 * DELETE /api/access-control/users/[id]
 * Delete a user
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    const repository = new AccessControlJsonRepository()

    // Check if user exists
    const existingUser = await repository.getUserById(userId)
    if (!existingUser) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'User not found',
      }
    }

    const result = await repository.deleteUser(userId)

    if (result) {
      return {
        success: true,
        message: `User ${existingUser.displayName} deleted successfully`,
      }
    }

    throw new Error('Failed to delete user')
  } catch (error: any) {
    console.error('DELETE /api/access-control/users/[id] error:', error)

    if (error.message.includes('not found')) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: error.message,
      }
    }

    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    }
  }
})
