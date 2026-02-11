/**
 * GET /api/sidebar/menu
 * Fetch sidebar menu configuration with role-based access control
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const repository = new AccessControlJsonRepository()
    const menu = await repository.getSidebarMenu()

    return {
      success: true,
      data: menu,
      message: 'Sidebar menu retrieved successfully',
    }
  } catch (error: any) {
    console.error('GET /api/sidebar/menu error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to fetch sidebar menu',
    }
  }
})
