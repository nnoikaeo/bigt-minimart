/**
 * GET /api/access-control/roles
 * Fetch all roles
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const repository = new AccessControlJsonRepository()
    const roles = await repository.getAllRoles()

    return {
      success: true,
      data: roles,
      count: roles.length,
      message: `Retrieved ${roles.length} roles`,
    }
  } catch (error: any) {
    console.error('GET /api/access-control/roles error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to fetch roles',
    }
  }
})
