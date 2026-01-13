import { adminDb } from '~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  try {
    // GET - Fetch all daily sales
    const salesRef = adminDb.collection('daily_sales')
    const snapshot = await salesRef.orderBy('date', 'desc').get()
    
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || doc.data().date,
    }))

    return {
      success: true,
      data: sales,
    }
  } catch (error: any) {
    console.error('Error fetching daily sales:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
