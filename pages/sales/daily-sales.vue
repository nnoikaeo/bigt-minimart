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

// Handle edit
const handleEdit = (entry: DailySalesEntry) => {
  editingEntry.value = entry
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

// Handle modal close
const handleModalClose = () => {
  showModal.value = false
  editingEntry.value = null
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
          <ActionButton
            :permission="PERMISSIONS.VIEW_SALES"
            size="sm"
            variant="ghost"
            title="ดูรายละเอียด"
          >
            👁️
          </ActionButton>

          <!-- Edit button -->
          <ActionButton
            :permission="PERMISSIONS.EDIT_SALES"
            size="sm"
            variant="ghost"
            :disabled="row.status === 'approved'"
            title="แก้ไข"
            @click="handleEdit(row)"
          >
            ✏️
          </ActionButton>

          <!-- Delete button -->
          <ActionButton
            :permission="PERMISSIONS.DELETE_SALES"
            size="sm"
            variant="danger"
            :disabled="row.status === 'approved'"
            title="ลบ"
            @click="handleDelete(row.id)"
          >
            🗑️
          </ActionButton>

          <!-- Approve button (owner only, pending status only) -->
          <ActionButton
            v-if="row.status === 'pending'"
            :permission="PERMISSIONS.APPROVE_SALES"
            size="sm"
            variant="success"
            title="อนุมัติ"
            @click="handleApprove(row.id)"
          >
            ✓
          </ActionButton>
        </div>
      </template>
    </DataTable>
  </PageWrapper>

  <!-- Modal for create/edit -->
  <DailySalesModal
    :open="showModal"
    :editing-entry="editingEntry"
    @close="handleModalClose"
    @submit="handleModalSubmit"
    @approve="handleApprove"
  />
</template>

