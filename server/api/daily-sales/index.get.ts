/**
 * GET /api/daily-sales
 * 
 * Fetch all daily sales entries (with optional filters)
 * Query params:
 *   - dateFrom: ISO date string (YYYY-MM-DD)
 *   - dateTo: ISO date string (YYYY-MM-DD)
 *   - status: submitted | audited | approved
 *   - cashierName: string for partial match
 * 
 * Response: DailySalesEntry[]
 */
import { salesJsonRepository } from '~/server/repositories/sales-json.repository'

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await salesJsonRepository.init()

    // Get query parameters for filtering
    const query = getQuery(event)
    let entries = await salesJsonRepository.getAll()

    // Apply filters if provided
    const dateFrom = query.dateFrom ? String(query.dateFrom) : null
    const dateTo = query.dateTo ? String(query.dateTo) : null
    
    if (dateFrom) {
      entries = entries.filter((e) => e.date >= dateFrom)
    }
    if (dateTo) {
      entries = entries.filter((e) => e.date <= dateTo)
    }
    if (query.status) {
      entries = entries.filter((e) => e.status === query.status)
    }
    if (query.cashierName) {
      entries = entries.filter((e) =>
        e.cashierName.toLowerCase().includes((query.cashierName as string).toLowerCase())
      )
    }

    // Sort by date descending (newest first)
    entries.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setResponseStatus(event, 200)
    return {
      success: true,
      data: entries,
      count: entries.length,
    }
  } catch (error: any) {
    console.error('❌ GET /api/daily-sales error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: `Failed to fetch daily sales: ${error.message || error}`,
    }
  }
})
