import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const tab = query.tab ? Number(query.tab) as 1 | 2 | 3 | 4 | 5 : undefined

    const repo = billPaymentJsonRepository
    await repo.init()
    const favorites = tab
      ? await repo.getFavoritesByTab(tab)
      : await repo.getFavorites()

    return { success: true, data: favorites }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch favorites',
    })
  }
})
