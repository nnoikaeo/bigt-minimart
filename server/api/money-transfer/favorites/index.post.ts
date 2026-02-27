import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'
import type { FavoriteTransfer } from '~/types/repositories'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    const tab = Number(body.tab)
    if (!tab || tab < 1 || tab > 5) {
      throw createError({ statusCode: 400, statusMessage: 'tab must be 1–5' })
    }
    if (!body.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'name is required' })
    }
    if (!['promptpay', 'bank'].includes(body.channel)) {
      throw createError({ statusCode: 400, statusMessage: 'channel must be promptpay or bank' })
    }
    if (!body.identifier?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'identifier is required' })
    }

    const repo = moneyTransferJsonRepository
    const tabItems = await repo.getFavoritesByTab(tab as 1 | 2 | 3 | 4 | 5)
    const nextOrder = tabItems.length + 1

    const data: Omit<FavoriteTransfer, 'id' | 'createdAt'> = {
      tab: tab as 1 | 2 | 3 | 4 | 5,
      order: nextOrder,
      name: body.name.trim(),
      channel: body.channel,
      identifier: body.identifier.trim(),
      identifierType: body.identifierType,
      bankName: body.bankName?.trim(),
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
