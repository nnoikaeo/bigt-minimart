<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useLogger } from '~/composables/useLogger'
import { useAccessControlStore } from '~/stores/access-control'
import { useAuthStore } from '~/stores/auth'
import type { DailySalesEntry } from '~/types/repositories'

interface Props {
  open: boolean
  editingEntry?: DailySalesEntry | null
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  editingEntry: null,
})

const emit = defineEmits<{
  close: []
  submit: [entry: Omit<DailySalesEntry, 'id' | 'submittedAt'>]
  approve: [id: string]
}>()

const logger = useLogger('DailySalesModal')
const accessControlStore = useAccessControlStore()
const authStore = useAuthStore()

// Check if user is owner
const isOwner = computed(() => {
  return authStore.getCurrentUser?.primaryRole === 'owner'
})

const canApprove = computed(() => {
  return isOwner.value && props.editingEntry?.status === 'pending'
})

const isFormDisabled = computed(() => {
  return props.editingEntry?.status === 'approved'
})

// Problem type categories for difference analysis
const PROBLEM_TYPES = [
  { id: 'cash_counting_error', label: 'นับเงินผิดหรือทอนเงินผิด' },
  { id: 'pos_operation_error', label: 'การใช้งานโปรแกรม POS' },
  { id: 'cancel_bill', label: 'ยกเลิกบิล' },
  { id: 'customer_deposit', label: 'ลูกค้าฝาก (ประชารัฐ/คนละครึ่ง)' },
  { id: 'bank_system_error', label: 'ระบบธนาคารขัดข้อง' },
  { id: 'supplier_issue', label: 'ปัญหาจากซัพพลายเออร์' },
  { id: 'other', label: 'อื่นๆ' },
] as const

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
  }
  return statusMap[status] || status
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const formatter = new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formatted = formatter.format(date)
  return formatted.replace(/\d{4}(?=\s|$)/, (year) => String(parseInt(year) - 543))
}

const formatApprovedDate = (approvedAt: string | Date | undefined): string => {
  if (!approvedAt) return ''
  const dateStr = typeof approvedAt === 'string' ? approvedAt : (approvedAt as Date).toISOString()
  const datePart = dateStr.split('T')[0] || ''
  return formatDate(datePart)
}

const calculateTotal = (posData: any): number => {
  return (posData.cash || 0) + (posData.qr || 0) + (posData.bank || 0) + (posData.government || 0)
}

// Helper to get approver display name
const getApproverName = (approvedById: string | undefined): string => {
  if (!approvedById) {
    logger.warn('[getApproverName] No approvedById provided')
    return 'Unknown'
  }

  const user = accessControlStore.getUserById(approvedById)
  logger.log('[getApproverName] Looking up user:', {
    approvedById,
    userFound: !!user,
    displayName: user?.displayName,
    allUsers: accessControlStore.getAllUsers.length,
  })

  if (!user) {
    logger.warn('[getApproverName] User not found in access control store:', approvedById)
  }

  return user?.displayName || approvedById
}

// Get cashiers from access control store
// This getter filters users who have 'cashier' role and are active
const cashiers = computed(() => {
  const cashierList = accessControlStore.getCashiers.map((user) => ({
    id: user.uid,
    name: user.displayName,
  }))
  logger.log('[cashiers] Retrieved cashiers:', cashierList)
  if (cashierList.length === 0) {
    logger.warn('[cashiers] No cashiers found in access control store')
  }
  return cashierList
})

// Form state with explicit type annotation
interface FormDataType {
  date: string
  cashierId: string
  cashierName: string
  expectedCash: number
  expectedQR: number
  expectedBank: number
  expectedGovernment: number
  posData: { cash: number; qr: number; bank: number; government: number }
  cashReconciliation: { expectedAmount: number; actualAmount: number; difference: number; notes: string }
  auditDetails: {
    cashAuditNotes: string // Problem category selected
    qrAuditNotes: string
    bankAuditNotes: string
    governmentAuditNotes: string
    recommendation: string
  }
  status: 'pending' | 'approved'
}

const formData = reactive<FormDataType>({
  date: '',
  cashierId: '',
  cashierName: '',
  expectedCash: 0,
  expectedQR: 0,
  expectedBank: 0,
  expectedGovernment: 0,
  posData: {
    cash: 0,
    qr: 0,
    bank: 0,
    government: 0,
  },
  cashReconciliation: {
    expectedAmount: 0,
    actualAmount: 0,
    difference: 0,
    notes: '',
  },
  auditDetails: {
    cashAuditNotes: '',
    qrAuditNotes: '',
    bankAuditNotes: '',
    governmentAuditNotes: '',
    recommendation: '',
  },
  status: 'pending',
})

logger.log('Form initialized:', formData)

const validationErrors = ref<Record<string, string>>({})
const submitting = ref(false)
const successMessage = ref('')

// Calculate totals
const totalAmount = computed(() => calculateTotal(formData.posData))
const expectedTotal = computed(() => {
  return formData.expectedCash + formData.expectedQR + formData.expectedBank + formData.expectedGovernment
})
const difference = computed(() => {
  return totalAmount.value - expectedTotal.value
})

// Calculate per-channel differences
const cashDiff = computed(() => formData.posData.cash - formData.expectedCash)
const qrDiff = computed(() => formData.posData.qr - formData.expectedQR)
const bankDiff = computed(() => formData.posData.bank - formData.expectedBank)
const governmentDiff = computed(() => formData.posData.government - formData.expectedGovernment)

// Auto-fill actual amount = total amount from payment channels
watch(
  () => formData.posData,
  () => {
    formData.cashReconciliation.actualAmount = totalAmount.value
  },
  { deep: true }
)

// Auto-calculate expectedAmount from per-channel inputs
watch(
  () => [formData.expectedCash, formData.expectedQR, formData.expectedBank, formData.expectedGovernment],
  () => {
    formData.cashReconciliation.expectedAmount = expectedTotal.value
  }
)

// Watch difference changes
watch(
  () => [totalAmount, expectedTotal],
  () => {
    formData.cashReconciliation.difference = difference.value
  }
)

// Handle cashier selection change
const handleCashierChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedId = target.value
  logger.log('[handleCashierChange] Selected ID:', selectedId)
  
  if (!selectedId) {
    formData.cashierId = ''
    formData.cashierName = ''
    logger.log('[handleCashierChange] Cleared selection')
    return
  }
  
  const selected = cashiers.value.find(c => c.id === selectedId)
  logger.log('[handleCashierChange] Found cashier:', selected)
  
  if (selected) {
    formData.cashierId = selected.id
    formData.cashierName = selected.name
    logger.log('✅ Cashier updated:', { id: formData.cashierId, name: formData.cashierName })
  }
}

// Initialize form for edit mode or reset for new entry
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    
    if (props.editingEntry) {
      // Edit mode: load entry data
      const entry = props.editingEntry
      formData.date = entry.date
      formData.cashierId = entry.cashierId
      formData.cashierName = entry.cashierName
      formData.expectedCash = entry.expectedCash || 0
      formData.expectedQR = entry.expectedQR || 0
      formData.expectedBank = entry.expectedBank || 0
      formData.expectedGovernment = entry.expectedGovernment || 0
      formData.posData = { ...entry.posData }
      formData.cashReconciliation = {
        ...entry.cashReconciliation,
        notes: entry.cashReconciliation.notes || '',
      }
      formData.auditDetails = entry.auditDetails || {
        cashAuditNotes: '',
        qrAuditNotes: '',
        bankAuditNotes: '',
        governmentAuditNotes: '',
        recommendation: '',
      }
      formData.status = entry.status
    } else {
      // Create mode: reset form to initial state
      resetForm()
    }
  }
)

// Reset form
const resetForm = () => {
  formData.date = ''
  formData.cashierId = ''
  formData.cashierName = ''
  formData.expectedCash = 0
  formData.expectedQR = 0
  formData.expectedBank = 0
  formData.expectedGovernment = 0
  formData.posData = { cash: 0, qr: 0, bank: 0, government: 0 }
  formData.cashReconciliation = {
    expectedAmount: 0,
    actualAmount: 0,
    difference: 0,
    notes: '',
  }
  formData.auditDetails = {
    cashAuditNotes: '',
    qrAuditNotes: '',
    bankAuditNotes: '',
    governmentAuditNotes: '',
    recommendation: '',
  }
  formData.status = 'pending'
  validationErrors.value = {}
  successMessage.value = ''
}

// Validate and submit
const handleSubmit = async () => {
  logger.log('[handleSubmit] FormData before validation:', formData)
  logger.log('[handleSubmit] cashierId:', formData.cashierId)
  logger.log('[handleSubmit] cashierName:', formData.cashierName)
  
  validationErrors.value = {}

  // Basic validation
  if (!formData.date) {
    validationErrors.value.date = 'วันที่เป็นข้อมูลที่จำเป็น'
  }

  if (!formData.cashierId) {
    validationErrors.value.cashierId = 'แคชเชียร์เป็นข้อมูลที่จำเป็น'
  }

  if (!formData.cashierName) {
    validationErrors.value.cashierName = 'ชื่อแคชเชียร์เป็นข้อมูลที่จำเป็น'
  }

  if (totalAmount.value === 0) {
    validationErrors.value.posData = 'กรุณากรอกยอดขายอย่างน้อย 1 ช่องทาง'
  }

  if (expectedTotal.value === 0) {
    validationErrors.value.expectedAmount = 'กรุณากรอกยอดคาดไว้อย่างน้อย 1 ช่องทาง'
  }

  // Conditional validation: per-channel audit notes only when difference exists
  if (cashDiff.value !== 0 && formData.auditDetails.cashAuditNotes === '') {
    validationErrors.value.cashAuditNotes = 'กรุณาเลือกประเภทปัญหา (เงินสด)'
  }

  if (qrDiff.value !== 0 && formData.auditDetails.qrAuditNotes === '') {
    validationErrors.value.qrAuditNotes = 'กรุณาเลือกประเภทปัญหา (QR Code)'
  }

  if (bankDiff.value !== 0 && formData.auditDetails.bankAuditNotes === '') {
    validationErrors.value.bankAuditNotes = 'กรุณาเลือกประเภทปัญหา (ธนาคาร)'
  }

  if (governmentDiff.value !== 0 && formData.auditDetails.governmentAuditNotes === '') {
    validationErrors.value.governmentAuditNotes = 'กรุณาเลือกประเภทปัญหา (โครงการรัฐ)'
  }

  if (Object.keys(validationErrors.value).length > 0) {
    logger.warn('Validation failed', validationErrors.value)
    return
  }

  submitting.value = true
  try {
    logger.log('Submitting daily sales entry', formData)
    emit('submit', {
      date: formData.date,
      cashierId: formData.cashierId,
      cashierName: formData.cashierName,
      expectedCash: formData.expectedCash,
      expectedQR: formData.expectedQR,
      expectedBank: formData.expectedBank,
      expectedGovernment: formData.expectedGovernment,
      posData: formData.posData,
      differences: {
        cashDiff: cashDiff.value,
        qrDiff: qrDiff.value,
        bankDiff: bankDiff.value,
        governmentDiff: governmentDiff.value,
      },
      cashReconciliation: {
        expectedAmount: formData.cashReconciliation.expectedAmount,
        actualAmount: formData.cashReconciliation.actualAmount,
        difference: formData.cashReconciliation.difference,
        notes: formData.cashReconciliation.notes || '',
      },
      auditDetails: {
        cashAuditNotes: formData.auditDetails.cashAuditNotes,
        qrAuditNotes: formData.auditDetails.qrAuditNotes,
        bankAuditNotes: formData.auditDetails.bankAuditNotes,
        governmentAuditNotes: formData.auditDetails.governmentAuditNotes,
        recommendation: formData.auditDetails.recommendation,
      },
      status: formData.status,
      submittedBy: 'current-user-id',
    })
    successMessage.value = 'บันทึกข้อมูลสำเร็จ'
    setTimeout(() => {
      resetForm()
      emit('close')
    }, 500)
  } catch (error) {
    logger.error('Failed to submit', error)
  } finally {
    submitting.value = false
  }
}

// Handle approve
const handleApprove = async () => {
  if (!props.editingEntry?.id) return

  submitting.value = true
  try {
    emit('approve', props.editingEntry.id)
    successMessage.value = 'อนุมัติรายงานเรียบร้อย'
    setTimeout(() => {
      emit('close')
    }, 500)
  } finally {
    submitting.value = false
  }
}

// Handle close
const handleClose = () => {
  resetForm()
  emit('close')
}
</script>

<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <!-- Modal Container -->
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center border-b border-red-800">
          <h2 class="text-xl font-bold text-white">
            {{ editingEntry ? 'แก้ไข' : 'เพิ่ม' }}
          </h2>
          <button
            @click="handleClose"
            class="text-white hover:bg-red-800 p-2 rounded transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
          <!-- Success Message -->
          <div
            v-if="successMessage"
            class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
          >
            ✓ {{ successMessage }}
          </div>

          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              ข้อมูลพื้นฐาน
            </h3>

            <!-- Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                วันที่ <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.date"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <p v-if="validationErrors.date" class="text-red-500 text-sm mt-1">
                {{ validationErrors.date }}
              </p>
            </div>

            <!-- Cashier Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                แคชเชียร์ <span class="text-red-500">*</span>
              </label>
              <div v-if="cashiers.length === 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
                ⚠️ ไม่พบข้อมูลแคชเชียร์ในระบบ กรุณาติดต่อผู้ดูแลระบบ
              </div>
              <select
                v-else
                v-model="formData.cashierId"
                @change="handleCashierChange"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">-- เลือกแคชเชียร์ --</option>
                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
                  {{ cashier.name }}
                </option>
              </select>
              <p v-if="validationErrors.cashierId" class="text-red-500 text-sm mt-1">
                {{ validationErrors.cashierId }}
              </p>
              <p v-if="validationErrors.cashierName" class="text-red-500 text-sm mt-1">
                {{ validationErrors.cashierName }}
              </p>
            </div>
          </div>

          <!-- SECTION A: Expected Per Channel (from POS) -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              📋 Section A: ยอดคาดไว้ (จากใบเสร็จ POS)
            </h3>

            <div class="grid grid-cols-2 gap-4">
              <!-- Expected Cash -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <label class="block text-sm font-semibold text-blue-900 mb-2">
                  💵 เงินสดคาดไว้
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.expectedCash"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- Expected QR -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <label class="block text-sm font-semibold text-purple-900 mb-2">
                  📱 QR Code คาดไว้
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.expectedQR"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <!-- Expected Bank -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <label class="block text-sm font-semibold text-green-900 mb-2">
                  🏦 ธนาคารคาดไว้
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.expectedBank"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <!-- Expected Government -->
              <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <label class="block text-sm font-semibold text-amber-900 mb-2">
                  🏛️ โครงการรัฐคาดไว้
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.expectedGovernment"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <!-- Expected Total -->
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-300">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold text-orange-900">รวมยอดคาดไว้</span>
                <span class="text-2xl font-bold text-orange-700">
                  {{ formatCurrency(expectedTotal) }}
                </span>
              </div>
            </div>

            <div v-if="validationErrors.expectedAmount" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              ⚠ {{ validationErrors.expectedAmount }}
            </div>
          </div>

          <!-- SECTION B: Actual Per Channel (from verification) -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              ✓ Section B: ยอดจริง (จากการตรวจสอบ)
            </h3>

            <div v-if="validationErrors.posData" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              ⚠ {{ validationErrors.posData }}
            </div>

            <!-- Payment channels grid -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Cash -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <label class="block text-sm font-semibold text-blue-900 mb-2">
                  💵 เงินสด
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.posData.cash"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- QR Code -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <label class="block text-sm font-semibold text-purple-900 mb-2">
                  📱 QR Code
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.posData.qr"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <!-- Bank Transfer -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <label class="block text-sm font-semibold text-green-900 mb-2">
                  🏦 ธนาคาร
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.posData.bank"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <!-- Government Program -->
              <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <label class="block text-sm font-semibold text-amber-900 mb-2">
                  🏛️ โครงการรัฐ
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.posData.government"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border-2 border-red-300">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold text-red-900">รวมยอดจริง</span>
                <span class="text-2xl font-bold text-red-700">
                  {{ formatCurrency(totalAmount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- SECTION C+D: Merged Differences & Per-Channel Audit Notes -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              ⚖️ Section C+D: ผลต่างและวิเคราะห์รายช่องทาง
            </h3>

            <!-- 2x2 Grid: 4 Payment Channels -->
            <div class="grid grid-cols-2 gap-4">
              <!-- CASH -->
              <div class="border-2 border-blue-300 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-900 mb-3">💵 เงินสด</h4>
                <div class="space-y-2">
                  <div class="text-sm">ยอดจริง: <span class="font-semibold">{{ formatCurrency(formData.posData.cash) }}</span></div>
                  <div :class="['text-sm font-semibold px-2 py-1 rounded', cashDiff > 0 ? 'bg-green-100 text-green-800' : cashDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']">
                    ผลต่าง: {{ formatCurrency(cashDiff) }}
                  </div>
                  <select v-if="cashDiff !== 0" v-model="formData.auditDetails.cashAuditNotes" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500">
                    <option value="">-- เลือกประเภทปัญหา --</option>
                    <option v-for="problem in PROBLEM_TYPES" :key="problem.id" :value="problem.id">
                      {{ problem.label }}
                    </option>
                  </select>
                  <div v-else class="text-xs text-gray-500">✓ ตรวจสอบแล้ว (ไม่มีผลต่าง)</div>
                  <p v-if="validationErrors.cashAuditNotes" class="text-red-500 text-xs">{{ validationErrors.cashAuditNotes }}</p>
                </div>
              </div>

              <!-- QR -->
              <div class="border-2 border-purple-300 p-4 rounded-lg">
                <h4 class="font-semibold text-purple-900 mb-3">📱 QR Code</h4>
                <div class="space-y-2">
                  <div class="text-sm">ยอดจริง: <span class="font-semibold">{{ formatCurrency(formData.posData.qr) }}</span></div>
                  <div :class="['text-sm font-semibold px-2 py-1 rounded', qrDiff > 0 ? 'bg-green-100 text-green-800' : qrDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']">
                    ผลต่าง: {{ formatCurrency(qrDiff) }}
                  </div>
                  <select v-if="qrDiff !== 0" v-model="formData.auditDetails.qrAuditNotes" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500">
                    <option value="">-- เลือกประเภทปัญหา --</option>
                    <option v-for="problem in PROBLEM_TYPES" :key="problem.id" :value="problem.id">
                      {{ problem.label }}
                    </option>
                  </select>
                  <div v-else class="text-xs text-gray-500">✓ ตรวจสอบแล้ว (ไม่มีผลต่าง)</div>
                  <p v-if="validationErrors.qrAuditNotes" class="text-red-500 text-xs">{{ validationErrors.qrAuditNotes }}</p>
                </div>
              </div>

              <!-- BANK -->
              <div class="border-2 border-green-300 p-4 rounded-lg">
                <h4 class="font-semibold text-green-900 mb-3">🏦 ธนาคาร</h4>
                <div class="space-y-2">
                  <div class="text-sm">ยอดจริง: <span class="font-semibold">{{ formatCurrency(formData.posData.bank) }}</span></div>
                  <div :class="['text-sm font-semibold px-2 py-1 rounded', bankDiff > 0 ? 'bg-green-100 text-green-800' : bankDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']">
                    ผลต่าง: {{ formatCurrency(bankDiff) }}
                  </div>
                  <select v-if="bankDiff !== 0" v-model="formData.auditDetails.bankAuditNotes" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500">
                    <option value="">-- เลือกประเภทปัญหา --</option>
                    <option v-for="problem in PROBLEM_TYPES" :key="problem.id" :value="problem.id">
                      {{ problem.label }}
                    </option>
                  </select>
                  <div v-else class="text-xs text-gray-500">✓ ตรวจสอบแล้ว (ไม่มีผลต่าง)</div>
                  <p v-if="validationErrors.bankAuditNotes" class="text-red-500 text-xs">{{ validationErrors.bankAuditNotes }}</p>
                </div>
              </div>

              <!-- GOVERNMENT -->
              <div class="border-2 border-amber-300 p-4 rounded-lg">
                <h4 class="font-semibold text-amber-900 mb-3">🏛️ โครงการรัฐ</h4>
                <div class="space-y-2">
                  <div class="text-sm">ยอดจริง: <span class="font-semibold">{{ formatCurrency(formData.posData.government) }}</span></div>
                  <div :class="['text-sm font-semibold px-2 py-1 rounded', governmentDiff > 0 ? 'bg-green-100 text-green-800' : governmentDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']">
                    ผลต่าง: {{ formatCurrency(governmentDiff) }}
                  </div>
                  <select v-if="governmentDiff !== 0" v-model="formData.auditDetails.governmentAuditNotes" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-amber-500">
                    <option value="">-- เลือกประเภทปัญหา --</option>
                    <option v-for="problem in PROBLEM_TYPES" :key="problem.id" :value="problem.id">
                      {{ problem.label }}
                    </option>
                  </select>
                  <div v-else class="text-xs text-gray-500">✓ ตรวจสอบแล้ว (ไม่มีผลต่าง)</div>
                  <p v-if="validationErrors.governmentAuditNotes" class="text-red-500 text-xs">{{ validationErrors.governmentAuditNotes }}</p>
                </div>
              </div>
            </div>

            <!-- Total Difference -->
            <div :class="['p-4 rounded-lg border-2 font-semibold text-center', difference > 0 ? 'bg-green-50 border-green-300 text-green-700' : difference < 0 ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700']">
              <div class="text-sm">รวมผลต่าง</div>
              <div class="text-2xl">{{ formatCurrency(difference) }}</div>
            </div>

            <!-- Recommendation (full-width) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ข้อแนะนำการปรับปรุง</label>
              <textarea v-model="formData.auditDetails.recommendation" placeholder="เช่น ควรเพิ่มความระมัดระวัง..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none h-20" />
            </div>

            <!-- Notes (full-width) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
              <textarea v-model="formData.cashReconciliation.notes" placeholder="ข้อมูลสรุปเพิ่มเติม..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none h-16" />
            </div>
          </div>

          <!-- Old Cash Reconciliation Section (Remove) -->
          <div class="space-y-4" style="display: none;">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              ผลต่างเงินสด
            </h3>

            <div v-if="validationErrors.cashReconciliation" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              ⚠ {{ validationErrors.cashReconciliation }}
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Expected Amount -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  ยอดคาดไว้
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    v-model.number="formData.cashReconciliation.expectedAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <!-- Actual Amount (Read-only, auto-filled from total) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  ยอดจริง (อัตโนมัติ)
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">฿</span>
                  <input
                    :value="formatCurrency(formData.cashReconciliation.actualAmount)"
                    type="text"
                    disabled
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  ← จากรวมยอด 4 ช่องทาง
                </p>
              </div>
            </div>

            <!-- Difference Display -->
            <div
              :class="[
                'p-4 rounded-lg border-2 font-semibold text-center',
                difference > 0
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : difference < 0
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700',
              ]"
            >
              <span class="block text-sm text-gray-600 mb-1">ผลต่าง</span>
              <span class="text-2xl">{{ formatCurrency(difference) }}</span>
            </div>

            <!-- Reconciliation Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                v-model="formData.cashReconciliation.notes"
                placeholder="เช่น เงินสด ขาด 50 บาท เนื่องจาก..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none h-20"
              />
            </div>
          </div>
        </div>

        <!-- Approval Section (Owner Only) -->
        <div v-if="editingEntry && isOwner" class="space-y-4 bg-green-50 p-6 border-b border-green-200">
          <h3 class="text-lg font-semibold text-green-800 border-b border-green-300 pb-2">
            การอนุมัติ (Owner)
          </h3>

          <!-- Current Status -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">สถานะปัจจุบัน:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-xs font-semibold',
              formData.status === 'pending'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-green-100 text-green-800'
            ]">
              {{ formatStatus(formData.status) }}
            </span>
          </div>

          <!-- Approval Info (if already approved) -->
          <div v-if="editingEntry.approvedAt" class="text-sm text-green-700">
            <div class="flex items-center gap-2">
              <span>✓</span>
              <span>อนุมัติแล้วเมื่อ: {{ formatApprovedDate(editingEntry.approvedAt) }}</span>
            </div>
            <div v-if="editingEntry.approvedBy" class="ml-6 text-xs text-gray-600">
              โดย: {{ getApproverName(editingEntry.approvedBy) }}
            </div>
          </div>

          <!-- Approve Button (if not yet approved) -->
          <button
            v-if="canApprove"
            @click="handleApprove"
            :disabled="submitting"
            class="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span v-if="submitting">กำลังอนุมัติ...</span>
            <span v-else>อนุมัติรายงาน</span>
          </button>

          <!-- Note: Editing disabled after approval -->
          <p v-if="editingEntry.status === 'approved'" class="text-xs text-gray-500 italic">
            หมายเหตุ: รายการที่อนุมัติแล้วไม่สามารถแก้ไขได้
          </p>
        </div>

        <!-- Footer -->
        <div class="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            @click="handleClose"
            type="button"
            class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            @click="handleSubmit"
            type="button"
            :disabled="submitting || isFormDisabled"
            class="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="submitting">{{ editingEntry ? 'กำลังอัปเดต...' : 'กำลังบันทึก...' }}</span>
            <span v-else-if="isFormDisabled">รายการที่อนุมัติแล้ว</span>
            <span v-else>{{ editingEntry ? 'อัปเดต' : 'บันทึก' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
