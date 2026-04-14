import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

const schema = z.object({
  status: z.enum(['completed', 'draft', 'on_hold', 'cancelled']),
  statusNote: z.string().optional(),
})

/**
 * PUT /api/bill-payment/transactions/[id]/status
 * Change transaction status (e.g. completed↔on_hold, →cancelled).
 */
export default defineEventHandler(async (event) => {
  try {
    await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, message: 'Transaction ID required' })

    const body = await readBody(event)
    const { status, statusNote } = schema.parse(body)

    const updated = await billPaymentJsonRepository.updateTransaction(id, {
      status,
      statusNote: statusNote ?? undefined,
    })

    return { success: true, data: updated }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to update transaction status: ${error.message}` })
  }
})
