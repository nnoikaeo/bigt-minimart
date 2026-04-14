/**
 * PUT /api/settings/bill-payment-fees
 *
 * Update bill-payment fee tiers (per bill type).
 *
 * Request body:
 *   { billTypes: Record<string, { label: string, tiers: FeeTier[] }>, updatedBy: string }
 *
 * Response:
 *   { success: boolean, data: BillPaymentFeeConfig }
 */
import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'

const DATA_DIR  = join(process.cwd(), 'public', 'data')
const DATA_FILE = join(DATA_DIR, 'bill-payment-fee-config.json')

const tierSchema = z.object({
  id:        z.number().int().positive(),
  label:     z.string().min(1),
  minAmount: z.number().int().nonnegative(),
  maxAmount: z.number().int().positive(),
  fee:       z.number().int().nonnegative(),
})

const billTypeConfigSchema = z.object({
  label: z.string().min(1),
  tiers: z.array(tierSchema).min(1),
})

const bodySchema = z.object({
  billTypes: z.record(z.string(), billTypeConfigSchema),
  updatedBy: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  try {
    const raw = await readBody(event)
    const { billTypes, updatedBy } = bodySchema.parse(raw)

    const config = {
      billTypes,
      updatedAt: new Date().toISOString(),
      updatedBy,
    }

    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(config, null, 2), 'utf-8')

    return { success: true, data: config }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'ข้อมูลไม่ถูกต้อง', data: error.issues })
    }
    console.error('❌ PUT /api/settings/bill-payment-fees error:', error)
    throw createError({ statusCode: 500, message: `บันทึกไม่สำเร็จ: ${error.message}` })
  }
})
