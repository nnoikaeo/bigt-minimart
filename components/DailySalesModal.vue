<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import type { DailySalesEntry, Cashier } from '~/composables/useDailySales'

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
  submit: [entry: Omit<DailySalesEntry, 'id' | 'createdAt' | 'updatedAt'>]
}>()

const logger = useLogger('DailySalesModal')
const { calculateTotal, validateEntry, formatCurrency, formatStatus, cashiers, fetchCashiers } = useDailySales()

// Form state
const formData = reactive({
  date: '',
  cashierId: '',
  cashierName: '',
  posposData: {
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
  status: 'submitted' as 'submitted' | 'audited' | 'approved',
})

const validationErrors = ref<Record<string, string>>({})
const submitting = ref(false)
const successMessage = ref('')

// Load cashiers on mount
onMounted(() => {
  fetchCashiers()
})

// Calculate totals
const totalAmount = computed(() => calculateTotal(formData.posposData))
const difference = computed(() => {
  return totalAmount.value - formData.cashReconciliation.expectedAmount
})

// Auto-fill actual amount = total amount from payment channels
watch(
  () => formData.posposData,
  () => {
    formData.cashReconciliation.actualAmount = totalAmount.value
  },
  { deep: true }
)

// Watch difference changes
watch(
  () => [totalAmount, formData.cashReconciliation.expectedAmount],
  () => {
    formData.cashReconciliation.difference = difference.value
  }
)

// Watch cashier selection - auto-fill ID when cashier name is selected
watch(
  () => formData.cashierName,
  (selectedName) => {
    const selected = cashiers.value.find(c => c.name === selectedName)
    if (selected) {
      formData.cashierId = selected.id
    }
  }
)

// Initialize form for edit mode
watch(
  () => props.editingEntry,
  (entry) => {
    if (entry) {
      formData.date = entry.date
      formData.cashierId = entry.cashierId
      formData.cashierName = entry.cashierName
      formData.posposData = { ...entry.posposData }
      formData.cashReconciliation = { ...entry.cashReconciliation }
      formData.status = entry.status
    }
  }
)

// Reset form
const resetForm = () => {
  formData.date = ''
  formData.cashierId = ''
  formData.cashierName = ''
  formData.posposData = { cash: 0, qr: 0, bank: 0, government: 0 }
  formData.cashReconciliation = {
    expectedAmount: 0,
    actualAmount: 0,
    difference: 0,
    notes: '',
  }
  formData.status = 'submitted'
  validationErrors.value = {}
  successMessage.value = ''
}

// Validate and submit
const handleSubmit = async () => {
  validationErrors.value = {}
  const validation = validateEntry(formData)

  if (!validation.valid) {
    validationErrors.value = validation.errors
    logger.warn('Validation failed', validation.errors)
    return
  }

  submitting.value = true
  try {
    logger.log('Submitting daily sales entry', formData)
    emit('submit', {
      date: formData.date,
      cashierId: formData.cashierId,
      cashierName: formData.cashierName,
      posposData: formData.posposData,
      cashReconciliation: formData.cashReconciliation,
      status: formData.status,
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
            {{ editingEntry ? 'แก้ไขบันทึกยอดขาย' : 'บันทึกยอดขายใหม่' }}
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
              <select
                v-model="formData.cashierName"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">-- เลือกแคชเชียร์ --</option>
                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.name">
                  {{ cashier.name }}
                </option>
              </select>
              <p v-if="validationErrors.cashierId" class="text-red-500 text-sm mt-1">
                {{ validationErrors.cashierId }}
              </p>
            </div>
          </div>

          <!-- Payment Channels -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">
              ยอดขาย 4 ช่องทาง
            </h3>

            <div v-if="validationErrors.posposData" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              ⚠ {{ validationErrors.posposData }}
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
                    v-model.number="formData.posposData.cash"
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
                    v-model.number="formData.posposData.qr"
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
                    v-model.number="formData.posposData.bank"
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
                    v-model.number="formData.posposData.government"
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
                <span class="text-lg font-semibold text-red-900">รวมยอดขาย</span>
                <span class="text-2xl font-bold text-red-700">
                  {{ formatCurrency(totalAmount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cash Reconciliation -->
          <div class="space-y-4">
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
            :disabled="submitting"
            class="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="submitting">{{ editingEntry ? 'กำลังอัปเดต...' : 'กำลังบันทึก...' }}</span>
            <span v-else>{{ editingEntry ? 'อัปเดต' : 'บันทึก' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
