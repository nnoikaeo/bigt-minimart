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
    const docRef = adminDb.collection('daily_sales').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        date: doc.data()?.date?.toDate?.() || doc.data()?.date,
      },
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
