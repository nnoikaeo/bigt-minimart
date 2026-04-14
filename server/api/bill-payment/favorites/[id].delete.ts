import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

    const repo = billPaymentJsonRepository
    await repo.init()
    await repo.deleteFavorite(id)
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete favorite',
    })
  }
})
