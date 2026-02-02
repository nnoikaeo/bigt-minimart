/**
 * GET /api/access-control/users
 * Fetch all users with their roles
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const repository = new AccessControlJsonRepository()
    const users = await repository.getAllUsers()

    return {
      success: true,
      data: users,
      count: users.length,
      message: `Retrieved ${users.length} users`,
    }
  } catch (error: any) {
    console.error('GET /api/access-control/users error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to fetch users',
    }
  }
})
