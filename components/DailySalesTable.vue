<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLogger } from '~/composables/useLogger'
import { useAuthStore } from '~/stores/auth'
import { useAccessControlStore } from '~/stores/access-control'
import type { DailySalesEntry } from '~/types/repositories'
import DailySalesDetailsModal from './DailySalesDetailsModal.vue'

interface Props {
  entries: DailySalesEntry[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [entry: DailySalesEntry]
  delete: [id: string]
  approve: [id: string]
}>()

const logger = useLogger('DailySalesTable')
const authStore = useAuthStore()
const accessControlStore = useAccessControlStore()

// Check if user is owner
const isOwner = computed(() => {
  return authStore.getCurrentUser?.primaryRole === 'owner'
})

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

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
  }
  return statusMap[status] || status
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

// Get problem type label by ID
const getProblemTypeLabel = (typeId: string): string => {
  const problemType = PROBLEM_TYPES.find((pt) => pt.id === typeId)
  return problemType?.label || typeId
}

// Get channel emoji
const getChannelEmoji = (channel: string): string => {
  const emojiMap: Record<string, string> = {
    cash: '💵',
    qr: '📱',
    bank: '🏦',
    government: '🏛️',
  }
  return emojiMap[channel] || '•'
}

const calculateTotal = (posData: any): number => {
  return (posData.cash || 0) + (posData.qr || 0) + (posData.bank || 0) + (posData.government || 0)
}

// Sorting
const sortBy = ref<'date' | 'cashierName' | 'total'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Search/Filter
const searchCashierName = ref('')
const searchDate = ref('')

// Filtered and sorted entries
const filteredEntries = computed(() => {
  return props.entries.filter((entry) => {
    if (!entry.cashierName) {
      console.warn('[DailySalesTable] Entry missing cashierName:', entry.id)
      return false
    }
    
    // Check cashier name filter
    if (searchCashierName.value) {
      const query = searchCashierName.value.toLowerCase()
      if (!entry.cashierName.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // Check date filter
    if (searchDate.value) {
      if (!entry.date.includes(searchDate.value)) {
        return false
      }
    }
    
    return true
  })
})

const sortedEntries = computed(() => {
  const sorted = [...filteredEntries.value].sort((a, b) => {
    let aVal: any = a[sortBy.value as keyof typeof a]
    let bVal: any = b[sortBy.value as keyof typeof b]

    if (sortBy.value === 'total') {
      aVal = calculateTotal(a.posData)
      bVal = calculateTotal(b.posData)
    }

    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  return sorted
})

// Pagination
const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return sortedEntries.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(sortedEntries.value.length / itemsPerPage.value))

// Status badge styling
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800 border border-orange-300',
    approved: 'bg-green-100 text-green-800 border border-green-300',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Delete confirmation
const deleteConfirm = ref<string | null>(null)

const handleDelete = (id: string) => {
  deleteConfirm.value = id
}

const confirmDelete = (id: string) => {
  logger.log(`Deleting entry ${id}`)
  emit('delete', id)
  deleteConfirm.value = null
}

const handleSort = (field: 'date' | 'cashierName' | 'total') => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
}

const handleReset = () => {
  searchCashierName.value = ''
  searchDate.value = ''
  currentPage.value = 1
  logger.log('Search filters reset')
}

const getSortIndicator = (field: string): string => {
  if (sortBy.value !== field) return '↕️'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Modal State for Details Display
const showDetailsModal = ref(false)
const selectedEntry = ref<DailySalesEntry | null>(null)

const openDetailsModal = (entry: DailySalesEntry) => {
  selectedEntry.value = entry
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedEntry.value = null
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search Bar -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <!-- Cashier Name Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ค้นหาชื่อแคชเชียร์</label>
          <input
            v-model="searchCashierName"
            type="text"
            placeholder="เช่น สมชาย, สินใจ..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <!-- Date Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ค้นหาตามวันที่</label>
          <input
            v-model="searchDate"
            type="date"
            placeholder="วว/ดด/ปปปป"
            :class="[
              'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-gray-400',
              searchDate ? 'text-gray-900' : 'text-gray-500'
            ]"
          />
        </div>
        <!-- Reset Button -->
        <div>
          <button
            @click="handleReset"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            🔄 รีเซ็ต
          </button>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p class="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="paginatedEntries.length === 0" class="flex flex-col items-center justify-center p-12">
        <div class="text-6xl mb-4">📋</div>
        <p class="text-gray-600 text-lg">ไม่พบบันทึกยอดขาย</p>
        <p class="text-gray-500 text-sm mt-1">เริ่มสร้างบันทึกใหม่ด้วยการคลิก "บันทึกใหม่"</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition" @click="handleSort('date')">
                📅 วันที่ {{ getSortIndicator('date') }}
              </th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition" @click="handleSort('cashierName')">
                👤 แคชเชียร์ {{ getSortIndicator('cashierName') }}
              </th>
              <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition" @click="handleSort('total')">
                💰 ยอดขาย {{ getSortIndicator('total') }}
              </th>
              <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                ⚖️ ผลต่าง
              </th>
              <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                🔖 สถานะ
              </th>
              <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                🎯 การกระทำ
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-for="entry in paginatedEntries" :key="entry.id">
              <!-- Main Row -->
              <tr class="hover:bg-gray-50 transition-colors">
                <!-- Date -->
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                  {{ formatDate(entry.date) }}
                </td>

                <!-- Cashier Name -->
                <td class="px-6 py-4 text-sm">
                  <div class="font-medium text-gray-900">{{ entry.cashierName }}</div>
                </td>

                <!-- Total Amount -->
                <td class="px-6 py-4 text-sm text-right">
                  <div class="font-semibold text-gray-900">
                    {{ formatCurrency(calculateTotal(entry.posData)) }}
                  </div>
                </td>

                <!-- Difference -->
                <td class="px-6 py-4 text-sm text-right">
                  <div
                    :class="[
                      'font-semibold px-2 py-1 rounded inline-block',
                      entry.cashReconciliation.difference > 0
                        ? 'bg-green-100 text-green-800'
                        : entry.cashReconciliation.difference < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800',
                    ]"
                  >
                    {{ formatCurrency(entry.cashReconciliation.difference) }}
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 text-center text-sm">
                  <span
                    :class="[
                      'inline-block px-3 py-1 rounded-full font-medium text-xs',
                      getStatusBadgeClass(entry.status),
                    ]"
                  >
                    {{ formatStatus(entry.status) }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-center text-sm space-x-2">
                  <!-- View Details Button -->
                  <button
                    @click="openDetailsModal(entry)"
                    class="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium transition-colors"
                    title="ดูรายละเอียด"
                  >
                    👁
                  </button>

                  <!-- Edit Button -->
                  <button
                    @click="emit('edit', entry)"
                    class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                  >
                    ✏️
                  </button>

                  <!-- Delete Button -->
                  <div class="inline-block relative group">
                    <button
                      @click="handleDelete(entry.id!)"
                      class="inline-block px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                    >
                      🗑️
                    </button>

                    <!-- Delete Confirmation Popup -->
                    <div
                      v-if="deleteConfirm === entry.id"
                      class="absolute right-0 mt-1 bg-white border border-red-300 rounded-lg shadow-lg p-3 z-10 w-48"
                    >
                      <p class="text-sm text-gray-700 mb-2">ยืนยันการลบ?</p>
                      <div class="flex gap-2">
                        <button
                          @click="deleteConfirm = null"
                          class="flex-1 px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-xs font-medium"
                        >
                          ยกเลิก
                        </button>
                        <button
                          @click="confirmDelete(entry.id!)"
                          class="flex-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Approve Button (Owner Only) -->
                  <button
                    v-if="isOwner && entry.status === 'pending'"
                    @click="emit('approve', entry.id!)"
                    class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
                    title="อนุมัติ"
                  >
                    ✓
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <!-- Left: Items Per Page Dropdown -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">แสดงรายการต่อหน้า:</label>
          <select
            v-model.number="itemsPerPage"
            @change="currentPage = 1"
            class="px-3 py-2 pr-8 min-w-fit border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>

        <!-- Middle: Pagination Buttons -->
        <div class="flex gap-2 flex-wrap justify-center">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← ก่อนหน้า
          </button>

          <button
            v-for="page in Math.min(5, totalPages)"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              currentPage === page
                ? 'bg-red-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100',
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ถัดไป →
          </button>
        </div>

        <!-- Right: Page Info -->
        <div class="text-sm text-gray-600 font-medium">
          หน้า {{ currentPage }} จาก {{ totalPages }}
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <DailySalesDetailsModal
      :open="showDetailsModal"
      :entry="selectedEntry"
      @close="closeDetailsModal"
    />
  </div>
</template>
