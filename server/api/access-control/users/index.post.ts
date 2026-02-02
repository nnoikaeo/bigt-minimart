/**
 * POST /api/access-control/users
 * Create a new user with roles
 */

import { z } from 'zod'
import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  roles: z
    .array(
      z.enum(['owner', 'manager', 'assistant_manager', 'cashier', 'auditor']),
    )
    .min(1, 'User must have at least one role'),
  primaryRole: z.enum([
    'owner',
    'manager',
    'assistant_manager',
    'cashier',
    'auditor',
  ]),
})

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = createUserSchema.parse(body)

    // Validate that primaryRole is in roles array
    if (!validatedData.roles.includes(validatedData.primaryRole)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Primary role must be one of the assigned roles',
      }
    }

    const repository = new AccessControlJsonRepository()
    const newUser = await repository.createUser({
      email: validatedData.email,
      displayName: validatedData.displayName,
      roles: validatedData.roles,
      primaryRole: validatedData.primaryRole,
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      data: newUser,
      message: `User ${newUser.displayName} created successfully`,
    }
  } catch (error: any) {
    console.error('POST /api/access-control/users error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

    // Handle business logic errors (e.g., email already exists)
    if (error.message.includes('already exists')) {
      setResponseStatus(event, 409)
      return {
        success: false,
        error: error.message,
      }
    }

    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to create user',
    }
  }
})
