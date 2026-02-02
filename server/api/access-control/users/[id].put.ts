/**
 * PUT /api/access-control/users/[id]
 * Update an existing user
 */

import { z } from 'zod'
import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

// Validation schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  roles: z
    .array(
      z.enum(['owner', 'manager', 'assistant_manager', 'cashier', 'auditor']),
    )
    .min(1, 'User must have at least one role')
    .optional(),
  primaryRole: z
    .enum(['owner', 'manager', 'assistant_manager', 'cashier', 'auditor'])
    .optional(),
  isActive: z.boolean().optional(),
})

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

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = updateUserSchema.parse(body)

    // If both roles and primaryRole are provided, validate
    if (validatedData.roles && validatedData.primaryRole) {
      if (!validatedData.roles.includes(validatedData.primaryRole)) {
        setResponseStatus(event, 400)
        return {
          success: false,
          error: 'Primary role must be one of the assigned roles',
        }
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

    const updatedUser = await repository.updateUser(userId, validatedData)

    return {
      success: true,
      data: updatedUser,
      message: `User ${updatedUser.displayName} updated successfully`,
    }
  } catch (error: any) {
    console.error('PUT /api/access-control/users/[id] error:', error)

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
      error: error.message || 'Failed to update user',
    }
  }
})
