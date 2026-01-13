import { adminDb } from '~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing sales entry ID',
    })
  }

  try {
    const user = (event.context as any).user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Please login',
      })
    }

    // Get existing document to verify it exists and user owns it
    const docRef = adminDb.collection('daily_sales').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Check ownership
    const existingData = doc.data()
    if (existingData?.userId !== user.uid) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this entry',
      })
    }

    // Delete document
    await docRef.delete()

    return {
      success: true,
      message: 'Sales entry deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
