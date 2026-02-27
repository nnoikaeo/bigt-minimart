import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/balances/opening
 *
 * Set the opening balance (bankAccount) for a given date.
 * Other balance fields (transferCash, serviceFeeTransfer, serviceFeeCash) always start at 0.
 *
 * Body: { date?: string, amount: number, source: 'carryover' | 'manual', userId?: string }
 * Response: { success: boolean, data: MoneyTransferBalance }
 */
export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const body = await readBody(event)
    const { amount, source, userId } = body
    const date: string = body.date || new Date().toISOString().split('T')[0]

    if (amount === undefined || amount === null || amount < 0) {
      throw createError({ statusCode: 400, message: 'amount ต้องมีค่า >= 0' })
    }
    if (source !== 'carryover' && source !== 'manual') {
      throw createError({ statusCode: 400, message: "source ต้องเป็น 'carryover' หรือ 'manual'" })
    }

    console.log(`[POST /api/money-transfer/balances/opening] date=${date}, amount=${amount}, source=${source}`)

    const balance = await moneyTransferJsonRepository.setOpeningBalance(date, amount, source, userId)

    console.log(`[POST /api/money-transfer/balances/opening] Opening balance set:`, balance.bankAccount)

    return { success: true, data: balance }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[POST /api/money-transfer/balances/opening] Error:', error)
    throw createError({ statusCode: 500, message: error.message })
  }
})
