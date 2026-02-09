<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSalesStore } from '~/stores/sales'
import { useAuthStore } from '~/stores/auth'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
import type { DailySalesEntry } from '~/types/repositories'
import type { DataTableColumn } from '~/components/ui/table/DataTable.vue'

// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

// Setup
const logger = useLogger('DailySales')
const salesStore = useSalesStore()
const { can } = usePermissions()

// Modal state
const showModal = ref(false)
const editingEntry = ref<DailySalesEntry | null>(null)
const isViewOnly = ref(false)
const successMessage = ref('')
const successType = ref<'success' | 'error'>('success')

// Computed properties from store
const sales = computed(() => salesStore.getAllSales)
const loading = computed(() => salesStore.isLoading)
const error = computed(() => salesStore.error)

// Table columns configuration
const columns: DataTableColumn[] = [
  {
    key: 'date',
    label: '📅 วันที่',
    sortable: true,
  },
  {
    key: 'cashierName',
    label: '👤 แคชเชียร์',
    sortable: true,
  },
  {
    key: 'posData',
    label: '💰 ยอดขาย',
    sortable: false,
    align: 'right',
    formatter: (posData: any) => {
      const total = (posData?.cash || 0) + (posData?.qr || 0) + (posData?.bank || 0) + (posData?.government || 0)
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
      }).format(total)
    },
  },
  {
    key: 'cashReconciliation',
    label: '⚖️ ผลต่าง',
    sortable: false,
    align: 'right',
    formatter: (cashReconciliation: any) => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
      }).format(cashReconciliation?.difference || 0)
    },
  },
  {
    key: 'status',
    label: '📊 สถานะ',
    sortable: true,
  },
  {
    key: 'actions',
    label: '🎯 การกระทำ',
    sortable: false,
    align: 'center',
  },
]

// Load sales on mount
onMounted(async () => {
  try {
    await salesStore.fetchDailySales()
  } catch (err: any) {
    logger.error('Failed to fetch sales', err)
  }
})

// Handle modal submit
const handleModalSubmit = async (entry: Omit<DailySalesEntry, 'id' | 'submittedAt'>) => {
  successType.value = 'success'
  try {
    if (editingEntry.value?.id) {
      // Update
      await salesStore.updateDailySale(editingEntry.value.id, entry)
      successMessage.value = 'อัปเดตบันทึกยอดขายเรียบร้อย'
      logger.log('Updated entry:', editingEntry.value.id)
    } else {
      // Create
      await salesStore.addDailySale(entry)
      successMessage.value = 'บันทึกยอดขายเรียบร้อย'
      logger.log('Created new entry')
    }

    editingEntry.value = null
    showModal.value = false

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    successMessage.value = err.message || 'เกิดข้อผิดพลาด'
    successType.value = 'error'
    logger.error('Error submitting entry', err)
  }
}

// Handle view (read-only mode)
const handleView = (entry: DailySalesEntry) => {
  editingEntry.value = entry
  isViewOnly.value = true
  showModal.value = true
}

// Handle edit (editable mode)
const handleEdit = (entry: DailySalesEntry) => {
  editingEntry.value = entry
  isViewOnly.value = false
  showModal.value = true
}

// Handle delete
const handleDelete = async (id: string) => {
  if (!can(PERMISSIONS.DELETE_SALES)) {
    successMessage.value = 'คุณไม่มีสิทธิ์ลบบันทึกยอดขาย'
    successType.value = 'error'
    return
  }

  if (!confirm('คุณต้องการลบบันทึกนี้หรือไม่?')) {
    return
  }

  try {
    logger.log('Deleting entry:', id)
    await salesStore.deleteDailySale(id)
    successMessage.value = 'ลบบันทึกเรียบร้อย'
    successType.value = 'success'
    logger.log('Deleted entry:', id)
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    successMessage.value = err.message || 'เกิดข้อผิดพลาดในการลบ'
    successType.value = 'error'
    logger.error('Error deleting entry', err)
  }
}

// Handle approve
const handleApprove = async (id: string) => {
  if (!can(PERMISSIONS.APPROVE_SALES)) {
    successMessage.value = 'คุณไม่มีสิทธิ์อนุมัติยอดขาย'
    successType.value = 'error'
    return
  }

  try {
    await salesStore.approveSale(id)
    successMessage.value = 'อนุมัติรายงานเรียบร้อย'
    successType.value = 'success'
    logger.log('Approved entry:', id)
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    successMessage.value = err.message || 'เกิดข้อผิดพลาดในการอนุมัติ'
    successType.value = 'error'
    logger.error('Error approving entry', err)
  }
}

// Format date to Thai locale (CE year)
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  const formatter = new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formatted = formatter.format(date)
  // Convert Buddhist Era (BE) to Common Era (CE): BE - 543 = CE
  return formatted.replace(/\d{4}(?=\s|$)/, (year) => String(parseInt(year) - 543))
}

// Get current user's role
const getUserRole = (): string => {
  const authStore = useAuthStore()
  return authStore.getCurrentUser?.primaryRole || 'cashier'
}

// Determine which action buttons to show based on role
const getAvailableActions = (role: string): string[] => {
  const roleActions: Record<string, string[]> = {
    owner: ['view', 'edit', 'delete'],
    manager: ['view'],
    assistant_manager: ['view'],
    auditor: ['view', 'edit'],
    cashier: ['view'],
  }
  return roleActions[role] || ['view']
}

// Handle modal close
const handleModalClose = () => {
  showModal.value = false
  editingEntry.value = null
  isViewOnly.value = false
  successMessage.value = ''
}

// Open create modal
const openCreateModal = () => {
  editingEntry.value = null
  showModal.value = true
}
</script>

<template>
  <PageWrapper
    title="ยอดขาย"
    description="บันทึกและจัดการยอดขายรายวันจากแคชเชียร์"
    icon="💰"
    :loading="loading"
    :error="error || (successType === 'error' ? successMessage : null)"
  >
    <!-- Action button in header -->
    <template #actions>
      <ActionButton
        :permission="PERMISSIONS.CREATE_SALES"
        variant="primary"
        @click="openCreateModal"
      >
        ➕ เพิ่ม
      </ActionButton>
    </template>

    <!-- Success Message -->
    <BaseAlert
      v-if="successMessage && successType === 'success'"
      variant="success"
      :message="successMessage"
      class="mb-4"
    />

    <!-- DataTable -->
    <DataTable
      :data="sales"
      :columns="columns"
      :loading="loading"
      row-key="id"
      :pagination="true"
      :page-size="10"
    >
      <!-- Date cell with Thai locale formatting -->
      <template #cell-date="{ value }">
        <span class="font-medium text-gray-900">{{ formatDate(value) }}</span>
      </template>

      <!-- Difference cell with conditional styling -->
      <template #cell-cashReconciliation="{ row }">
        <div
          :class="[
            'inline-flex items-center gap-1.5 font-medium rounded-full px-3 py-0 text-sm',
            row.cashReconciliation?.difference === 0
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300',
          ]"
        >
          {{ row.cashReconciliation?.difference === 0 ? '✓' : '⚠️' }}
          {{
            new Intl.NumberFormat('th-TH', {
              style: 'currency',
              currency: 'THB',
              minimumFractionDigits: 0,
            }).format(row.cashReconciliation?.difference || 0)
          }}
        </div>
      </template>

      <!-- Status cell with badge -->
      <template #cell-status="{ value }">
        <BaseBadge
          :variant="value === 'approved' ? 'success' : 'warning'"
          size="sm"
        >
          {{ value === 'approved' ? '✓ อนุมัติแล้ว' : '⏳ รออนุมัติ' }}
        </BaseBadge>
      </template>

      <!-- Actions slot for row buttons -->
      <template #actions="{ row }">
        <div class="flex gap-2 justify-center flex-wrap">
          <!-- View button -->
          <button
            v-if="getAvailableActions(getUserRole()).includes('view')"
            @click="handleView(row)"
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
            title="ดูรายละเอียด"
          >
            👁️
          </button>

          <!-- Edit button -->
          <button
            v-if="getAvailableActions(getUserRole()).includes('edit') && row.status !== 'approved'"
            @click="handleEdit(row)"
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            title="แก้ไข"
          >
            ✏️
          </button>

          <!-- Delete button -->
          <button
            v-if="getAvailableActions(getUserRole()).includes('delete') && row.status !== 'approved'"
            @click="handleDelete(row.id)"
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
            title="ลบ"
          >
            🗑️
          </button>

          <!-- Approve button (owner only, pending status only) -->
          <button
            v-if="getUserRole() === 'owner' && row.status !== 'approved'"
            @click="handleApprove(row.id)"
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
            title="อนุมัติ"
          >
            ✅
          </button>
        </div>
      </template>
    </DataTable>
  </PageWrapper>

  <!-- Modal for create/edit/view -->
  <DailySalesModal
    :open="showModal"
    :editing-entry="editingEntry"
    :view-only="isViewOnly"
    @close="handleModalClose"
    @submit="handleModalSubmit"
    @approve="handleApprove"
  />
</template>

