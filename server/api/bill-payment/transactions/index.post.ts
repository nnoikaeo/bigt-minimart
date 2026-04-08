import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timestamp: z.string().optional(),
  transactionType: z.enum(['bill_payment', 'owner_deposit']),
  billType: z.enum(['utility', 'telecom', 'insurance', 'other']).optional(),
  amount: z.number().nonnegative(),
  commission: z.number().nonnegative().default(0),
  customerName: z.string().optional(),
  status: z.enum(['success', 'failed']),
  notes: z.string().optional(),
  recordedBy: z.string(),
  recordedAt: z.string().optional(),
})

/**
 * POST /api/bill-payment/transactions
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const body = await readBody(event)
    const validated = schema.parse(body)

    const now = new Date().toISOString()
    const txn = await billPaymentJsonRepository.addTransaction({
      ...validated,
      timestamp: validated.timestamp ?? now,
      recordedAt: validated.recordedAt ?? now,
      recordedBy: authUser.uid, // server-verified identity overrides client-supplied value
    })

    setResponseStatus(event, 201)
    return { success: true, data: txn }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    throw createError({ statusCode: 500, message: `Failed to create transaction: ${error.message}` })
  }
})
