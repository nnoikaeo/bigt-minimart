/**
 * PUT /api/sidebar/pages/[pageKey]
 * Update required roles for a specific page in sidebar menu
 * Only accessible to Owner role
 */

import { AccessControlJsonRepository } from '~/server/repositories/access-control-json.repository'

export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = await requireAuth(event)

    // Check if user has Owner role
    if (!user.roles.includes('owner')) {
      setResponseStatus(event, 403)
      return {
        success: false,
        error: 'Only owner can modify sidebar menu access control',
      }
    }

    const pageKey = getRouterParam(event, 'pageKey')
    const body = await readBody<{ requiredRoles: string[] | null }>(event)

    if (!pageKey) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'Page key is required',
      }
    }

    if (!body || body.requiredRoles === undefined) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: 'requiredRoles is required',
      }
    }

    const repository = new AccessControlJsonRepository()
    await repository.updatePageRequiredRoles(pageKey, body.requiredRoles)

    return {
      success: true,
      message: `Page ${pageKey} access control updated successfully`,
    }
  } catch (error: any) {
    console.error('PUT /api/sidebar/pages error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error.message || 'Failed to update page access control',
    }
  }
})
