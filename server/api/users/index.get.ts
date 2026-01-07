import { userService } from '~/server/utils/user-service'

export default defineEventHandler(async (event) => {
  try {
    // Get all active users
    const users = await userService.getAllUsers()
    const activeUsers = users.filter(u => u.isActive)

    return {
      success: true,
      data: activeUsers,
      count: activeUsers.length,
    }
  } catch (error: any) {
    console.error('Error getting users:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
