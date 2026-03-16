<script setup lang="ts">
import { computed } from 'vue'
import { useMoneyTransferHelpers } from '~/composables/useMoneyTransferHelpers'

type WorkflowStatus =
  | 'step1_in_progress'
  | 'step1_completed'
  | 'step2_completed'
  | 'audited'
  | 'approved'
  | 'needs_correction'

interface Props {
  date: string
  totalTransactions: number
  successCount: number
  totalCommission: number
  workflowStatus: WorkflowStatus
}

const props = defineProps<Props>()

const { formatCurrency } = useMoneyTransferHelpers()

const formattedDate = computed(() => {
  return new Date(props.date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

const statusBadge = computed<{ label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }>(() => {
  const map: Record<WorkflowStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    step1_in_progress: { label: 'กำลังทำงาน', variant: 'info' },
    step1_completed: { label: 'รอตรวจนับเงิน', variant: 'info' },
    step2_completed: { label: 'รอตรวจสอบ', variant: 'warning' },
    audited: { label: 'รออนุมัติ', variant: 'warning' },
    approved: { label: 'อนุมัติแล้ว', variant: 'success' },
    needs_correction: { label: 'รอแก้ไข', variant: 'error' },
  }
  return map[props.workflowStatus]
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl px-4 py-3">
    <!-- Row 1: Summary stats -->
    <div class="text-sm text-gray-600">
      📅 {{ formattedDate }}
      · {{ totalTransactions }} รายการ
      · สำเร็จ {{ successCount }}
      · ค่าบริการ {{ formatCurrency(totalCommission) }}
    </div>

    <!-- Row 2: Status badge -->
    <div class="mt-1 flex items-center gap-2">
      <span class="text-sm text-gray-600">สถานะ:</span>
      <BaseBadge :variant="statusBadge.variant" size="sm" dot>
        {{ statusBadge.label }}
      </BaseBadge>
    </div>
  </div>
</template>
