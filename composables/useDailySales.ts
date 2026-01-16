import { ref, reactive } from 'vue'

// Cashier type
export interface Cashier {
  id: string // Firebase UID
  name: string // ชื่อแคชเชียร์
  email: string
}

// Payment channel data type
export interface PaymentChannels {
  cash: number // เงินสด
  qr: number // QR Code
  bank: number // ธนาคาร
  government: number // โครงการรัฐ
}

// Cash reconciliation type
export interface CashReconciliation {
  expectedAmount: number // ยอดคาดไว้
  actualAmount: number // ยอดจริง
  difference: number // ผลต่าง
  notes: string // หมายเหตุ
}

// Daily Sales Entry interface
export interface DailySalesEntry {
  id?: string
  date: string // วันที่
  cashierId: string // ID แคชเชียร์
  cashierName: string // ชื่อแคชเชียร์
  posposData: PaymentChannels // ยอดขาย 4 ช่องทาง
  cashReconciliation: CashReconciliation // ผลต่างเงินสด
  status: 'submitted' | 'audited' | 'approved' // สถานะ
  submittedBy?: string // ผู้บันทึก (Auditor ID)
  submittedAt?: Date // เวลาบันทึก
  auditedBy?: string // ผู้ตรวจสอบ (Owner/Manager ID)
  auditedAt?: Date // เวลาตรวจสอบ
  auditNotes?: string // หมายเหตุการตรวจสอบ
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
  const cashiers = ref<Cashier[]>([])
  const loading = ref(false)
  const error = ref('')

  // Calculate total amount from payment channels
  const calculateTotal = (channels: PaymentChannels): number => {
    return channels.cash + channels.qr + channels.bank + channels.government
  }

  // Validate form data
  const validateEntry = (entry: Partial<DailySalesEntry>): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    if (!entry.date) {
      errors.date = 'วันที่เป็นข้อมูลที่จำเป็น'
    }

    if (!entry.cashierId) {
      errors.cashierId = 'ชื่อแคชเชียร์เป็นข้อมูลที่จำเป็น'
    }

    if (!entry.posposData) {
      errors.posposData = 'ข้อมูลยอดขายเป็นข้อมูลที่จำเป็น'
    } else {
      const { cash, qr, bank, government } = entry.posposData
      if (cash < 0 || qr < 0 || bank < 0 || government < 0) {
        errors.posposData = 'ยอดขายต้องมากกว่าหรือเท่ากับ 0'
      }
      if (cash + qr + bank + government === 0) {
        errors.posposData = 'กรุณากรอกยอดขายอย่างน้อย 1 ช่องทาง'
      }
    }

    if (!entry.cashReconciliation) {
      errors.cashReconciliation = 'ข้อมูลผลต่างเงินสดเป็นข้อมูลที่จำเป็น'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Format currency to Thai Baht
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  // Format date to Thai format (DD MMM YYYY)
  const formatDateThai = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ]
    const day = d.getDate()
    const month = thaiMonths[d.getMonth()]
    const year = d.getFullYear() + 543 // Buddhist year
    return `${day} ${month} ${year}`
  }

  // Format status to Thai
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      submitted: 'บันทึกแล้ว',
      audited: 'ตรวจสอบแล้ว',
      approved: 'อนุมัติแล้ว',
    }
    return statusMap[status] || status
  }

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

  // Fetch all cashiers for dropdown selection
  const fetchCashiers = async () => {
    error.value = ''
    try {
      logger.log('Fetching cashiers list...')
      const response = await $fetch<ApiResponse<Cashier[]>>('/api/users?role=cashier')
      cashiers.value = response.data || []
      logger.table('Cashiers', cashiers.value)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch cashiers'
      logger.error('Failed to fetch cashiers', err)
      // Fallback: return empty array instead of failing
      cashiers.value = []
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
    cashiers,
    loading,
    error,
    fetchSales,
    fetchCashiers,
    createSales,
    updateSales,
    deleteSales,
    calculateTotal,
    validateEntry,
    formatCurrency,
    formatDateThai,
    formatStatus,
  }
}
