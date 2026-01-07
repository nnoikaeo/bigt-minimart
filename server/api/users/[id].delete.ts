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

    // Delete user (soft delete)
    await userService.deleteUser(id)

    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
