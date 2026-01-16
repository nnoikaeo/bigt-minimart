import { userService } from '~/server/utils/user-service'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const roleFilter = query.role as string | undefined

    // Get all active users
    const users = await userService.getAllUsers()
    let activeUsers = users.filter(u => u.isActive)

    // Filter by role if specified
    if (roleFilter) {
      activeUsers = activeUsers.filter(u => u.role === roleFilter)
    }

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
