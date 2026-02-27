/**
 * GET /api/settings/money-transfer-fees
 *
 * Returns the current money-transfer fee tier configuration.
 * Falls back to default tiers if the config file does not exist yet.
 */
import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'public', 'data', 'money-transfer-fee-config.json')

const DEFAULT_CONFIG = {
  tiers: [
    { id: 1, label: '1 – 999',        minAmount: 1,    maxAmount: 999,   fee: 10 },
    { id: 2, label: '1,000 – 3,999',  minAmount: 1000, maxAmount: 3999,  fee: 20 },
    { id: 3, label: '4,000 – 6,999',  minAmount: 4000, maxAmount: 6999,  fee: 30 },
    { id: 4, label: '7,000 – 10,000', minAmount: 7000, maxAmount: 10000, fee: 40 },
  ],
  updatedAt: null,
  updatedBy: null,
}

export default defineEventHandler(async () => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(content)
    return { success: true, data }
  } catch {
    // File doesn't exist yet — return defaults
    return { success: true, data: DEFAULT_CONFIG }
  }
})
