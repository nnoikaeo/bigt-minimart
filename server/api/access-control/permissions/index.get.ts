/**
 * GET /api/access-control/permissions
 * Fetch all permissions
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const repository = new AccessControlJsonRepository()
    const permissions = await repository.getAllPermissions()

    return {
      success: true,
      data: permissions,
      count: permissions.length,
      message: `Retrieved ${permissions.length} permissions`,
    }
  } catch (error: any) {
    console.error('GET /api/access-control/permissions error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to fetch permissions',
    }
  }
})
