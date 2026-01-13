import { ref, reactive } from 'vue'

export interface DailySalesEntry {
  id?: string
  date: string
  amount: number
  notes: string
  userId?: string
  createdAt?: Date
  updatedAt?: Date
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

export const useDailySales = () => {
  const logger = useLogger('DailySales')
  const sales = ref<DailySalesEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  // Fetch all sales entries
  const fetchSales = async () => {
    loading.value = true
    error.value = ''
    try {
      logger.log('Fetching daily sales entries...')
      const response = await $fetch<ApiResponse<DailySalesEntry[]>>('/api/daily-sales')
      sales.value = response.data || []
      logger.table('Sales entries', sales.value)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch sales'
      logger.error('Failed to fetch sales', err)
    } finally {
      loading.value = false
    }
  }

  // Create new sales entry
  const createSales = async (entry: Omit<DailySalesEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResult<DailySalesEntry>> => {
    error.value = ''
    try {
      logger.log('Creating sales entry', entry)
      const response = await $fetch<ApiResponse<DailySalesEntry>>('/api/daily-sales', {
        method: 'POST',
        body: entry,
      })
      if (response.success) {
        logger.info('Sales entry created successfully', response.data)
        await fetchSales()
        return { success: true, data: response.data }
      }
      return { success: false, error: response.error || 'Failed to create entry' }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create sales entry'
      error.value = errorMsg
      logger.error('Failed to create sales', err)
      return { success: false, error: errorMsg }
    }
  }

  // Update sales entry
  const updateSales = async (id: string, entry: Partial<DailySalesEntry>): Promise<ApiResult<DailySalesEntry>> => {
    error.value = ''
    try {
      logger.log(`Updating sales entry ${id}`, entry)
      const response = await $fetch<ApiResponse<DailySalesEntry>>(`/api/daily-sales/${id}`, {
        method: 'PUT',
        body: entry,
      })
      if (response.success) {
        logger.info('Sales entry updated successfully', response.data)
        await fetchSales()
        return { success: true, data: response.data }
      }
      return { success: false, error: response.error || 'Failed to update entry' }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update sales entry'
      error.value = errorMsg
      logger.error('Failed to update sales', err)
      return { success: false, error: errorMsg }
    }
  }

  // Delete sales entry
  const deleteSales = async (id: string): Promise<ApiResult<void>> => {
    error.value = ''
    try {
      logger.log(`Deleting sales entry ${id}`)
      const response = await $fetch<ApiResponse<void>>(`/api/daily-sales/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        logger.info('Sales entry deleted successfully')
        await fetchSales()
        return { success: true }
      }
      return { success: false, error: response.error || 'Failed to delete entry' }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete sales entry'
      error.value = errorMsg
      logger.error('Failed to delete sales', err)
      return { success: false, error: errorMsg }
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    createSales,
    updateSales,
    deleteSales,
  }
}
