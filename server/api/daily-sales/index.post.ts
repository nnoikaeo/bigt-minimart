import { z } from 'zod'
import { adminDb } from '~/server/utils/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

const createDailySalesSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  amount: z.number().positive('Amount must be greater than 0'),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Get user from context (set by auth middleware)
    const user = (event.context as any).user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Please login',
      })
    }

    const body = await readBody(event)
    const validatedData = createDailySalesSchema.parse(body)

    // Create new document
    const newEntry = {
      date: Timestamp.fromDate(new Date(validatedData.date)),
      amount: validatedData.amount,
      notes: validatedData.notes || '',
      userId: user.uid,
      userName: user.displayName || user.email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await adminDb.collection('daily_sales').add(newEntry)

    return {
      success: true,
      data: {
        id: docRef.id,
        ...newEntry,
        date: newEntry.date.toDate(),
        createdAt: newEntry.createdAt.toDate(),
        updatedAt: newEntry.updatedAt.toDate(),
      },
      message: 'Daily sales entry created successfully',
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }
    console.error('Error creating daily sales:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
    })
  }
})
