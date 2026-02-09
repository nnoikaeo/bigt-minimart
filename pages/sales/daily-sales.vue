<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSalesStore } from '~/stores/sales'
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

// Confirmation dialog state
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmDialogVariant = ref<'danger' | 'warning' | 'info' | 'success'>('warning')
const confirmCallback = ref<(() => Promise<void>) | null>(null)

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

// Handle delete - show confirmation dialog
const handleDelete = (id: string) => {
  if (!can(PERMISSIONS.DELETE_SALES)) {
    successMessage.value = 'คุณไม่มีสิทธิ์ลบบันทึกยอดขาย'
    successType.value = 'error'
    return
  }

  // Set up confirmation callback
  confirmMessage.value = 'คุณต้องการลบบันทึกนี้หรือไม่?'
  confirmDialogVariant.value = 'danger'
  confirmCallback.value = async () => {
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

  // Show dialog with danger variant
  showConfirmDialog.value = true
}

// Handle approve - show confirmation dialog
const handleApprove = (id: string) => {
  if (!can(PERMISSIONS.APPROVE_SALES)) {
    successMessage.value = 'คุณไม่มีสิทธิ์อนุมัติยอดขาย'
    successType.value = 'error'
    return
  }

  // Set up confirmation callback
  confirmMessage.value = 'ยืนยันการอนุมัติรายการนี้หรือไม่?'
  confirmDialogVariant.value = 'success'
  confirmCallback.value = async () => {
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

  // Show dialog
  showConfirmDialog.value = true
}

// Handle confirmation dialog confirm
const handleConfirmDialogConfirm = async () => {
  if (confirmCallback.value) {
    await confirmCallback.value()
  }
  showConfirmDialog.value = false
  confirmCallback.value = null
}

// Handle confirmation dialog cancel
const handleConfirmDialogCancel = () => {
  showConfirmDialog.value = false
  confirmCallback.value = null
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
        ✚ เพิ่ม
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
              : Math.abs(row.cashReconciliation?.difference || 0) <= 5
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-red-100 text-red-800 border border-red-300',
          ]"
        >
          {{ row.cashReconciliation?.difference === 0 ? '✓' : row.cashReconciliation?.difference && Math.abs(row.cashReconciliation.difference) <= 5 ? '⚠️' : '❌' }}
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
          <!-- View button - always available -->
          <ActionButton
            :permission="PERMISSIONS.VIEW_SALES"
            variant="ghost"
            size="sm"
            @click="handleView(row)"
            title="ดูรายละเอียด"
          >
            🔍
          </ActionButton>

          <!-- Edit button -->
          <ActionButton
            :permission="PERMISSIONS.EDIT_SALES"
            variant="ghost"
            size="sm"
            :disabled="row.status === 'approved'"
            @click="handleEdit(row)"
            title="แก้ไข"
          >
            ✏️
          </ActionButton>

          <!-- Delete button -->
          <ActionButton
            :permission="PERMISSIONS.DELETE_SALES"
            variant="danger"
            size="sm"
            :disabled="row.status === 'approved'"
            @click="handleDelete(row.id)"
            title="ลบ"
          >
            🗑️
          </ActionButton>

          <!-- Approve button (owner only, pending status only) -->
          <ActionButton
            v-if="row.status !== 'approved'"
            :permission="PERMISSIONS.APPROVE_SALES"
            variant="success"
            size="sm"
            @click="handleApprove(row.id)"
            title="อนุมัติ"
          >
            ✅
          </ActionButton>
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

  <!-- Confirmation dialog for approve/delete -->
  <ConfirmDialog
    :open="showConfirmDialog"
    :title="confirmDialogVariant === 'danger' ? 'ยืนยันการลบ' : 'ยืนยันการอนุมัติ'"
    :message="confirmMessage"
    :confirm-text="confirmDialogVariant === 'danger' ? 'ลบ' : 'อนุมัติ'"
    cancel-text="ยกเลิก"
    :variant="confirmDialogVariant"
    @confirm="handleConfirmDialogConfirm"
    @cancel="handleConfirmDialogCancel"
  />
</template>

