<script setup lang="ts">
import { computed } from 'vue'
import { useAccessControlStore } from '~/stores/access-control'
import type { DailySalesEntry } from '~/types/repositories'

interface Props {
  open: boolean
  entry: DailySalesEntry | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const accessControlStore = useAccessControlStore()

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  const formatter = new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formatted = formatter.format(date)
  // Convert Buddhist Year (BE) to Common Era (CE): BE - 543 = CE
  return formatted.replace(/\d{4}(?=\s|$)/, (year) => String(parseInt(year) - 543))
}

const formatApprovedDate = (approvedAt: string | Date | undefined): string => {
  if (!approvedAt) return ''
  const dateStr = typeof approvedAt === 'string' ? approvedAt : (approvedAt as Date).toISOString()
  const datePart = dateStr.split('T')[0] || ''
  return formatDate(datePart)
}

const getApproverName = (approvedById: string | undefined): string => {
  if (!approvedById) return 'Unknown'
  const user = accessControlStore.getUserById(approvedById)
  return user?.displayName || approvedById
}

// Problem type categories
const PROBLEM_TYPES = [
  { id: 'cash_counting_error', label: 'นับเงินผิดหรือทอนเงินผิด' },
  { id: 'pos_operation_error', label: 'การใช้งานโปรแกรม POS' },
  { id: 'cancel_bill', label: 'ยกเลิกบิล' },
  { id: 'customer_deposit', label: 'ลูกค้าฝาก (ประชารัฐ/คนละครึ่ง)' },
  { id: 'bank_system_error', label: 'ระบบธนาคารขัดข้อง' },
  { id: 'supplier_issue', label: 'ปัญหาจากซัพพลายเออร์' },
  { id: 'other', label: 'อื่นๆ' },
] as const

const getProblemTypeLabel = (typeId: string): string => {
  const problemType = PROBLEM_TYPES.find((pt) => pt.id === typeId)
  return problemType?.label || typeId
}

// Get status badge styling
const getStatusBadgeClass = computed(() => {
  if (!props.entry) return ''
  return props.entry.status === 'approved'
    ? 'bg-green-100 text-green-800'
    : 'bg-orange-100 text-orange-800'
})

const getStatusBadgeText = computed(() => {
  if (!props.entry) return ''
  return props.entry.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && entry"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleClose"
      @keydown.esc="handleClose"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header (Sticky) -->
        <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <!-- Row 1: Title + Close Button -->
          <div class="flex justify-between items-start mb-3">
            <h2 class="text-xl font-bold text-white">
              👁 รายละเอียดยอดขาย - {{ formatDate(entry.date) }} - {{ entry.cashierName }}
            </h2>
            <button
              @click="handleClose"
              class="text-white hover:bg-purple-800 p-2 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Row 2: Status + Submitted Info (Always Show) -->
          <div class="flex items-center gap-3 flex-wrap">
            <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusBadgeClass]">
              {{ getStatusBadgeText }}
            </span>
            <span class="text-purple-100 text-sm">
              📝 ส่งเมื่อ {{ formatDate(entry.submittedAt as any) }}
              โดย {{ entry.submittedBy || entry.cashierName }}
            </span>
          </div>

          <!-- Row 3: Approval Info (Show Only If Approved) -->
          <div v-if="entry.approvedAt && entry.approvedBy" class="mt-2">
            <span class="text-purple-100 text-sm">
              ✓ อนุมัติเมื่อ {{ formatApprovedDate(entry.approvedAt) }}
              โดย {{ getApproverName(entry.approvedBy) }}
            </span>
          </div>
        </div>

        <!-- Body (Scrollable) -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Channel Cards Grid (2x2) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 💵 Cash Channel -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💵</span>
                <span>เงินสด</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">คาดหวัง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.expectedCash || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ยอดจริง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.posData.cash) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="text-gray-600">ผลต่าง:</span>
                  <span
                    :class="[
                      'font-semibold',
                      entry.differences?.cashDiff ?? 0 > 0
                        ? 'text-green-600'
                        : entry.differences?.cashDiff ?? 0 < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    ]"
                  >
                    {{ formatCurrency(entry.differences?.cashDiff ?? 0) }}
                  </span>
                </div>
                <div v-if="entry.auditDetails?.cashAuditNotes" class="mt-3 pt-2 border-t">
                  <span class="inline-block bg-blue-50 border border-blue-200 text-blue-900 text-xs px-2 py-1 rounded">
                    ⚠️ {{ getProblemTypeLabel(entry.auditDetails.cashAuditNotes) }}
                  </span>
                </div>
                <div v-else class="mt-3 pt-2 border-t text-xs text-gray-500">
                  ✓ ไม่พบปัญหา
                </div>
              </div>
            </div>

            <!-- 📱 QR Code Channel -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📱</span>
                <span>QR Code</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">คาดหวัง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.expectedQR || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ยอดจริง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.posData.qr) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="text-gray-600">ผลต่าง:</span>
                  <span
                    :class="[
                      'font-semibold',
                      entry.differences?.qrDiff ?? 0 > 0
                        ? 'text-green-600'
                        : entry.differences?.qrDiff ?? 0 < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    ]"
                  >
                    {{ formatCurrency(entry.differences?.qrDiff ?? 0) }}
                  </span>
                </div>
                <div v-if="entry.auditDetails?.qrAuditNotes" class="mt-3 pt-2 border-t">
                  <span class="inline-block bg-purple-50 border border-purple-200 text-purple-900 text-xs px-2 py-1 rounded">
                    ⚠️ {{ getProblemTypeLabel(entry.auditDetails.qrAuditNotes) }}
                  </span>
                </div>
                <div v-else class="mt-3 pt-2 border-t text-xs text-gray-500">
                  ✓ ไม่พบปัญหา
                </div>
              </div>
            </div>

            <!-- 🏦 Bank Channel -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏦</span>
                <span>ธนาคาร</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">คาดหวัง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.expectedBank || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ยอดจริง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.posData.bank) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="text-gray-600">ผลต่าง:</span>
                  <span
                    :class="[
                      'font-semibold',
                      entry.differences?.bankDiff ?? 0 > 0
                        ? 'text-green-600'
                        : entry.differences?.bankDiff ?? 0 < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    ]"
                  >
                    {{ formatCurrency(entry.differences?.bankDiff ?? 0) }}
                  </span>
                </div>
                <div v-if="entry.auditDetails?.bankAuditNotes" class="mt-3 pt-2 border-t">
                  <span class="inline-block bg-green-50 border border-green-200 text-green-900 text-xs px-2 py-1 rounded">
                    ⚠️ {{ getProblemTypeLabel(entry.auditDetails.bankAuditNotes) }}
                  </span>
                </div>
                <div v-else class="mt-3 pt-2 border-t text-xs text-gray-500">
                  ✓ ไม่พบปัญหา
                </div>
              </div>
            </div>

            <!-- 🏛️ Government Channel -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏛️</span>
                <span>โครงการรัฐ</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">คาดหวัง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.expectedGovernment || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ยอดจริง:</span>
                  <span class="font-medium">{{ formatCurrency(entry.posData.government) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="text-gray-600">ผลต่าง:</span>
                  <span
                    :class="[
                      'font-semibold',
                      entry.differences?.governmentDiff ?? 0 > 0
                        ? 'text-green-600'
                        : entry.differences?.governmentDiff ?? 0 < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    ]"
                  >
                    {{ formatCurrency(entry.differences?.governmentDiff ?? 0) }}
                  </span>
                </div>
                <div v-if="entry.auditDetails?.governmentAuditNotes" class="mt-3 pt-2 border-t">
                  <span class="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2 py-1 rounded">
                    ⚠️ {{ getProblemTypeLabel(entry.auditDetails.governmentAuditNotes) }}
                  </span>
                </div>
                <div v-else class="mt-3 pt-2 border-t text-xs text-gray-500">
                  ✓ ไม่พบปัญหา
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer (Sticky) - Compact Version -->
        <div class="sticky bottom-0 bg-gray-50 px-6 py-3 border-t flex justify-end">
          <button
            @click="handleClose"
            class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
