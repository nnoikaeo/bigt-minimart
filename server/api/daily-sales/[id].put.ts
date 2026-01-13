import { z } from 'zod'
import { adminDb } from '~/server/utils/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

const updateDailySalesSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  notes: z.string().optional(),
})

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

    const body = await readBody(event)
    const validatedData = updateDailySalesSchema.parse(body)

    // Get existing document to verify it exists and user owns it
    const docRef = adminDb.collection('daily_sales').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Sales entry not found',
      })
    }

    // Check ownership (basic check - can be extended)
    const existingData = doc.data()
    if (existingData?.userId !== user.uid) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this entry',
      })
    }

    // Build update object
    const updateData: any = {
      updatedAt: Timestamp.now(),
    }

    if (validatedData.date) {
      updateData.date = Timestamp.fromDate(new Date(validatedData.date))
    }
    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    // Update document
    await docRef.update(updateData)

    // Fetch updated document
    const updatedDoc = await docRef.get()

    return {
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        date: updatedDoc.data()?.date?.toDate?.() || updatedDoc.data()?.date,
      },
      message: 'Sales entry updated successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating sales entry:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
