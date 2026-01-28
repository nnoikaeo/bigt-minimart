<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLogger } from '~/composables/useLogger'
import type { DailySalesEntry } from '~/types/repositories'

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
}>()

const logger = useLogger('DailySalesTable')

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDateThai = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  const formatter = new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return formatter.format(date)
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    submitted: 'รอตรวจสอบ',
    audited: 'ตรวจสอบแล้ว',
    approved: 'อนุมัติแล้ว',
  }
  return statusMap[status] || status
}

const calculateTotal = (posposData: any): number => {
  return (posposData.cash || 0) + (posposData.qr || 0) + (posposData.bank || 0) + (posposData.government || 0)
}

// Sorting
const sortBy = ref<'date' | 'cashierName' | 'total'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Search/Filter
const searchQuery = ref('')

// Filtered and sorted entries
const filteredEntries = computed(() => {
  return props.entries.filter((entry) => {
    const query = searchQuery.value.toLowerCase()
    return (
      entry.cashierName.toLowerCase().includes(query) ||
      entry.cashierId.toLowerCase().includes(query) ||
      entry.date.includes(query)
    )
  })
})

const sortedEntries = computed(() => {
  const sorted = [...filteredEntries.value].sort((a, b) => {
    let aVal: any = a[sortBy.value as keyof typeof a]
    let bVal: any = b[sortBy.value as keyof typeof b]

    if (sortBy.value === 'total') {
      aVal = calculateTotal(a.posposData)
      bVal = calculateTotal(b.posposData)
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
    submitted: 'bg-blue-100 text-blue-800 border border-blue-300',
    audited: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
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

const getSortIndicator = (field: string): string => {
  if (sortBy.value !== field) return '↕️'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">บันทึกยอดขาย</h2>
      <div class="text-sm text-gray-600">
        ทั้งหมด {{ sortedEntries.length }} รายการ
      </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-white rounded-lg shadow p-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="ค้นหาจากชื่อแคชเชียร์ หรือ ID หรือ วันที่..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
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
            <tr
              v-for="entry in paginatedEntries"
              :key="entry.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <!-- Date -->
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ formatDateThai(entry.date) }}
              </td>

              <!-- Cashier Name -->
              <td class="px-6 py-4 text-sm">
                <div class="font-medium text-gray-900">{{ entry.cashierName }}</div>
                <div class="text-gray-500 text-xs">{{ entry.cashierId }}</div>
              </td>

              <!-- Total Amount -->
              <td class="px-6 py-4 text-sm text-right">
                <div class="font-semibold text-gray-900">
                  {{ formatCurrency(calculateTotal(entry.posposData)) }}
                </div>
                <div class="text-gray-600 text-xs grid grid-cols-2 gap-1 mt-1">
                  <span>💵 {{ formatCurrency(entry.posposData.cash) }}</span>
                  <span>📱 {{ formatCurrency(entry.posposData.qr) }}</span>
                  <span>🏦 {{ formatCurrency(entry.posposData.bank) }}</span>
                  <span>🏛️ {{ formatCurrency(entry.posposData.government) }}</span>
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
                <div v-if="entry.cashReconciliation.notes" class="text-gray-600 text-xs mt-1">
                  📝 {{ entry.cashReconciliation.notes }}
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
                <!-- Edit Button -->
                <button
                  @click="emit('edit', entry)"
                  class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                >
                  ✏️ แก้ไข
                </button>

                <!-- Delete Button -->
                <div class="inline-block relative group">
                  <button
                    @click="handleDelete(entry.id!)"
                    class="inline-block px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                  >
                    🗑️ ลบ
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-between items-center bg-white rounded-lg shadow p-4">
      <div class="text-sm text-gray-600">
        หน้า {{ currentPage }} จาก {{ totalPages }}
        <span class="ml-2">|</span>
        <span class="ml-2">{{ itemsPerPage }} รายการต่อหน้า</span>
      </div>

      <div class="flex gap-2">
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
    </div>
  </div>
</template>
