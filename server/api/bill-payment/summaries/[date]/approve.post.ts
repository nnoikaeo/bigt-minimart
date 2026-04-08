import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

const schema = z.object({
  decision: z.enum(['approved', 'approved_with_notes', 'needs_correction']),
  approvalNotes: z.string().optional(),
})

/**
 * POST /api/bill-payment/summaries/[date]/approve
 * WF 3.3: Owner approval
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    const body = await readBody(event)
    const validated = schema.parse(body)

    const summary = await billPaymentJsonRepository.getDailySummary(date)
    if (!summary) throw createError({ statusCode: 404, message: `No summary for ${date}` })

    const updatedSummary = await billPaymentJsonRepository.submitOwnerApproval(date, {
      ...validated,
      approvedBy: authUser.uid,
      approvedByName: authUser.name ?? 'Owner',
    })

    return { success: true, data: updatedSummary, message: 'Approval submitted.' }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to submit approval: ${error.message}` })
  }
})
