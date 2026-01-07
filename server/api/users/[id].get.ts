import { userService } from '~/server/utils/user-service'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required',
      })
    }

    const user = await userService.getUserById(id)
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    return {
      success: true,
      data: user,
    }
  } catch (error: any) {
    console.error('Error getting user:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
