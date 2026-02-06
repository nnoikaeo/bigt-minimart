/**
 * PUT /api/access-control/roles/[id]/permissions
 * Update permissions for a specific role
 */

import { z } from 'zod'
import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

// Validation schema for updating permissions
const updatePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()),
})

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

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = updatePermissionsSchema.parse(body)

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

    const updatedPermissions = await repository.updateRolePermissions(
      roleId,
      validatedData.permissions,
    )

    return {
      success: true,
      data: updatedPermissions,
      message: `Permissions for role ${existingRole.name} updated successfully`,
    }
  } catch (error: any) {
    console.error('PUT /api/access-control/roles/[id]/permissions error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

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
      error: error.message || 'Failed to update role permissions',
    }
  }
})
