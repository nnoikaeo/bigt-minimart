import { z } from 'zod'
import { userService } from '~/server/utils/user-service'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  role: z.enum(['owner', 'manager', 'assistant_manager', 'cashier', 'auditor']),
  posNumber: z.union([z.literal(1), z.literal(2)]).transform(val => val?.toString()).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Read and validate body
    const body = await readBody(event)
    const validatedData = createUserSchema.parse(body)

    // Create user (createdBy will be set to 'admin' for now)
    const newUser = await userService.createUser(validatedData, 'admin')

    return {
      success: true,
      data: newUser,
      message: 'User created successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
