import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

    const body = await readBody(event)

    const allowed = ['name', 'channel', 'identifier', 'identifierType', 'bankName', 'tab', 'order']
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const repo = moneyTransferJsonRepository
    const updated = await repo.updateFavorite(id, data)
    return { success: true, data: updated }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update favorite',
    })
  }
})
