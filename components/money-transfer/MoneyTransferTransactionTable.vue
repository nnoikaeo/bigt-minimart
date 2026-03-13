<script setup lang="ts">
/**
 * Shared transaction table body.
 * Used in: index.vue (full manager table, auditor active form with issue-toggle, auditor read-only).
 *
 * Props:
 *  - transactions:   array of transaction objects
 *  - issuedIds:      optional Record<string, true> — rows with this id get a red tint + "พบปัญหา" badge
 *  - emptyMessage:   override the empty-state description
 *
 * Slots:
 *  - #action-header  — content for the last <th> (default: "จัดการ")
 *  - #actions(txn)   — content for the last <td> per row (buttons etc.)
 *
 * Emits:
 *  - row-click(txn)  — fired when a data row is clicked
 */
import { EyeIcon } from '@heroicons/vue/24/outline'
import { useMoneyTransferHelpers } from '~/composables/useMoneyTransferHelpers'

const props = defineProps<{
  transactions: any[]
  issuedIds?: Record<string, true>
  emptyMessage?: string
  /** Row number offset for pagination. Default 0 → rows numbered from 1. */
  indexOffset?: number
}>()

const emit = defineEmits<{
  (e: 'row-click', txn: any): void
}>()

const {
  formatCurrency,
  formatTime,
  getTransactionTypeLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  getAccountName,
  getChannelSubtitle,
} = useMoneyTransferHelpers()
</script>

<template>
  <div class="overflow-x-auto">
    <table v-if="transactions.length > 0" class="w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left px-4 py-3 font-medium text-gray-600">#</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">ชื่อบัญชี</th>
          <th class="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
          <th class="text-right px-4 py-3 font-medium text-gray-600">ค่าบริการ</th>
          <th class="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
          <th class="text-center px-4 py-3 font-medium text-gray-600">
            <slot name="action-header">จัดการ</slot>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="(txn, idx) in transactions"
          :key="txn.id"
          :class="[
            'hover:bg-gray-50 transition-colors cursor-pointer',
            issuedIds?.[txn.id] ? 'bg-red-50 hover:bg-red-100' : '',
          ]"
          @click="emit('row-click', txn)"
        >
          <td class="px-4 py-3 text-gray-500">{{ (indexOffset ?? 0) + (idx as number) + 1 }}</td>
          <td class="px-4 py-3 text-gray-700">{{ formatTime(txn.datetime) }}</td>
          <td class="px-4 py-3 text-gray-900 font-medium">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
          <td class="px-4 py-3 hidden md:table-cell">
            <div class="text-gray-900 text-sm">{{ getAccountName(txn) }}</div>
            <div v-if="getChannelSubtitle(txn)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(txn) }}</div>
          </td>
          <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(txn.amount) }}</td>
          <td class="px-4 py-3 text-right text-gray-600">
            <template v-if="txn.transactionType !== 'owner_deposit'">
              {{ txn.commission ? formatCurrency(txn.commission) : '-' }}
              <span v-if="txn.commissionType" class="text-xs text-gray-400 ml-1">
                {{ txn.commissionType === 'cash' ? 'C' : 'T' }}
              </span>
            </template>
            <template v-else>-</template>
          </td>
          <td class="px-4 py-3 text-center" @click.stop>
            <div class="flex flex-col items-center gap-1">
              <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm" dot>
                {{ getStatusLabel(txn.status) }}
              </BaseBadge>
              <BaseBadge v-if="issuedIds?.[txn.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
            </div>
          </td>
          <td class="px-4 py-3 text-center" @click.stop>
            <div class="flex items-center justify-center gap-1">
              <!-- Default: eye button only — parent can override via #actions slot -->
              <slot name="actions" :txn="txn">
                <button
                  class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label="ดูรายละเอียด"
                  @click="emit('row-click', txn)"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
              </slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-else
      icon="📋"
      title="ยังไม่มีรายการ"
      :description="emptyMessage ?? 'ไม่มีรายการธุรกรรมสำหรับวันที่เลือก'"
    />
  </div>
</template>
