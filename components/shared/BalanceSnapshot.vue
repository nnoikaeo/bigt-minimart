<script setup lang="ts">
/**
 * Shared 3-card balance snapshot (Opening → Net Change → Closing).
 * Generic version — usable by Money Transfer, Bill Payment, or any service.
 *
 * Slot (default): content placed below the 3 cards (e.g. bank-statement input, cash detail row).
 */

const props = withDefaults(
  defineProps<{
    openingBalance: number
    closingBalance: number
    netChangeLabel?: string
  }>(),
  {
    netChangeLabel: 'สุทธิระหว่างวัน',
  },
)

const netChange = computed(() => props.closingBalance - props.openingBalance)

function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ฿'
  )
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <!-- 3-card row -->
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="bg-blue-50 rounded-lg p-3 text-center">
        <div class="text-xs text-blue-600 mb-1">ยอดเปิดบัญชี (เริ่มต้นวัน)</div>
        <div class="text-lg font-bold text-blue-900">{{ formatCurrency(openingBalance) }}</div>
      </div>
      <div :class="['rounded-lg p-3 text-center', netChange >= 0 ? 'bg-green-50' : 'bg-red-50']">
        <div :class="['text-xs mb-1', netChange >= 0 ? 'text-green-600' : 'text-red-600']">{{ netChangeLabel }}</div>
        <div :class="['text-lg font-bold', netChange >= 0 ? 'text-green-800' : 'text-red-800']">
          {{ netChange >= 0 ? '+' : '' }}{{ formatCurrency(netChange) }}
        </div>
      </div>
      <div class="bg-gray-100 rounded-lg p-3 text-center ring-1 ring-gray-300">
        <div class="text-xs text-gray-500 mb-1">ยอดปิดบัญชี (ที่คาดหวัง)</div>
        <div class="text-lg font-bold text-gray-900">{{ formatCurrency(closingBalance) }}</div>
      </div>
    </div>
    <!-- Slot for extra rows (bank statement info, cash breakdown, etc.) -->
    <slot />
  </div>
</template>
