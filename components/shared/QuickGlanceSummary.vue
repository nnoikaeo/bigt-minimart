<script setup lang="ts">
import { computed } from 'vue'
import type { UnifiedWorkflowStatus } from '~/types/shared-workflow'
import { getWorkflowStatusConfig } from '~/types/shared-workflow'

interface Props {
  date: string
  totalTransactions: number
  successCount: number
  totalCommission: number
  workflowStatus: UnifiedWorkflowStatus
  /** Custom label for commission, e.g. "ค่าธรรมเนียม" (default: "ค่าบริการ") */
  customLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  customLabel: 'ค่าบริการ',
})

const formattedDate = computed(() => {
  return new Date(props.date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ฿'
  )
}

const statusBadge = computed(() => {
  const config = getWorkflowStatusConfig(props.workflowStatus)
  return { label: config.label, variant: config.badgeVariant }
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
    <div class="text-sm text-gray-600">
      📅 {{ formattedDate }}
      · {{ totalTransactions }} รายการ
      · สำเร็จ {{ successCount }}
      · {{ customLabel }} {{ formatCurrency(totalCommission) }}
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">สถานะ:</span>
      <BaseBadge :variant="statusBadge.variant" size="sm" dot>
        {{ statusBadge.label }}
      </BaseBadge>
    </div>
  </div>
</template>
