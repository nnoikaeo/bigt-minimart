/**
 * GET /api/access-control/roles/[id]/permissions
 * Fetch permissions for a specific role
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const roleId = getRouterParam(event, 'id')
    if (!roleId) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Role ID is required',
      }
    }

    const repository = new AccessControlJsonRepository()

    // Check if role exists
    const existingRole = await repository.getRoleById(roleId)
    if (!existingRole) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: 'Role not found',
      }
    }

    // Fetch role permissions
    const rolePermissions = await repository.getRolePermissions(roleId)

    return {
      success: true,
      data: rolePermissions,
      message: `Permissions for role ${existingRole.name} retrieved successfully`,
    }
  } catch (error: any) {
    console.error('GET /api/access-control/roles/[id]/permissions error:', error)

    // Handle business logic errors
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
      error: error.message || 'Failed to fetch role permissions',
    }
  }
})
