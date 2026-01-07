import { z } from 'zod'
import { userService } from '~/server/utils/user-service'

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.enum(['owner', 'manager', 'assistant_manager', 'cashier', 'auditor']).optional(),
  posNumber: z.union([z.literal(1), z.literal(2)]).optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required',
      })
    }

    // Read and validate body
    const body = await readBody(event)
    const validatedData = updateUserSchema.parse(body)

    // Update user
    const updatedUser = await userService.updateUser(id, validatedData)

    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.errors,
      })
    }
    console.error('Error updating user:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
