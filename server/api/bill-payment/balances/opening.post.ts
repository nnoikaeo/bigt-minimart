import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().nonnegative(),
  source: z.enum(['carryover', 'manual']),
  userId: z.string().optional(),
})

/**
 * POST /api/bill-payment/balances/opening
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const body = await readBody(event)
    const { date, amount, source, userId } = schema.parse(body)

    const balance = await billPaymentJsonRepository.setOpeningBalance(date, amount, source, userId)

    return { success: true, data: balance }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    throw createError({ statusCode: 500, message: `Failed to set opening balance: ${error.message}` })
  }
})
