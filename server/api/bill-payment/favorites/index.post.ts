import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import type { BillPaymentFavorite } from '~/types/bill-payment'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const tab = Number(body.tab)
    if (!tab || tab < 1 || tab > 5) {
      throw createError({ statusCode: 400, statusMessage: 'tab must be 1–5' })
    }
    if (!body.label?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'label is required' })
    }

    const repo = billPaymentJsonRepository
    await repo.init()

    const tabItems = await repo.getFavoritesByTab(tab as 1 | 2 | 3 | 4 | 5)
    const nextOrder = tabItems.length + 1

    const data: Omit<BillPaymentFavorite, 'id' | 'createdAt'> = {
      tab: tab as 1 | 2 | 3 | 4 | 5,
      order: nextOrder,
      label: body.label.trim(),
      customerName: body.customerName?.trim() || undefined,
      billType: body.billType || undefined,
      defaultAmount: body.defaultAmount ? Number(body.defaultAmount) : undefined,
      defaultCommission: body.defaultCommission ? Number(body.defaultCommission) : undefined,
    }

    const created = await repo.addFavorite(data)
    return { success: true, data: created }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to add favorite',
    })
  }
})
