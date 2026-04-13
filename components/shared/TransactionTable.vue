<script setup lang="ts">
/**
 * Shared generic transaction table.
 * Usable by Money Transfer, Bill Payment, or any service.
 *
 * Columns:
 *  - Pass `columns` array to define which columns to render and how.
 *  - Simple columns use `formatter(value, row) => string`.
 *  - Complex columns (components, badges) use `component: 'slot-name'` and provide
 *    a scoped slot `#col-[slot-name]="{ row, value }"`.
 *
 * Slots:
 *  - #action-header   — content for the last <th> (default: "จัดการ")
 *  - #actions(txn)    — content for the last <td> per row (default: eye button)
 *  - #col-[name]      — custom cell renderer for columns with component: 'name'
 *  - #empty           — override entire empty state
 *
 * Emits:
 *  - row-click(txn)   — fired when a data row is clicked
 *
 * Optional features:
 *  - Filter tabs:  pass showFilterTabs + filterTabs; emit update:activeFilter
 *  - Pagination:   pass showPagination; internal state; emit page-change(page)
 */
import { EyeIcon } from '@heroicons/vue/24/outline'

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  /** Simple cell: return formatted string */
  formatter?: (value: any, row: any) => string
  /** Complex cell: use scoped slot named `col-[component]` with { row, value } */
  component?: string
  /** Extra classes on <td> */
  tdClass?: string
  /** Hide on mobile (adds `hidden md:table-cell`) */
  hideOnMobile?: boolean
}

export interface FilterTab {
  key: string
  label: string
  count?: number
}

const props = withDefaults(
  defineProps<{
    transactions: any[]
    columns: TableColumn[]
    issuedIds?: Record<string, true>
    emptyMessage?: string
    /** Row number offset for pagination. Default 0 → rows numbered from 1. */
    indexOffset?: number
    /** Show built-in pagination controls */
    showPagination?: boolean
    /** Page size when showPagination is true */
    pageSize?: number
    /** Show filter tab bar above the table */
    showFilterTabs?: boolean
    filterTabs?: FilterTab[]
    /** Currently active filter tab key (use with v-model:activeFilter) */
    activeFilter?: string
  }>(),
  {
    indexOffset: 0,
    showPagination: false,
    pageSize: 10,
    showFilterTabs: false,
  },
)

const emit = defineEmits<{
  (e: 'row-click', txn: any): void
  (e: 'update:activeFilter', key: string): void
  (e: 'page-change', page: number): void
}>()

// --- Internal pagination (used when showPagination=true) ---
const currentPage = ref(1)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.transactions.length / props.pageSize)),
)
const displayedRows = computed(() => {
  if (!props.showPagination) return props.transactions
  const start = (currentPage.value - 1) * props.pageSize
  return props.transactions.slice(start, start + props.pageSize)
})

function goToPrev() {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('page-change', currentPage.value)
  }
}
function goToNext() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emit('page-change', currentPage.value)
  }
}

// Reset to page 1 when data changes
watch(
  () => props.transactions,
  () => { currentPage.value = 1 },
)

// --- Effective index offset (internal pagination must account for page) ---
const effectiveOffset = computed(() =>
  props.showPagination
    ? (currentPage.value - 1) * props.pageSize
    : props.indexOffset,
)

// --- Align helper ---
function alignClass(align?: 'left' | 'center' | 'right') {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}
</script>

<template>
  <div>
    <!-- Filter Tabs -->
    <div
      v-if="showFilterTabs && filterTabs?.length"
      class="flex border-b border-gray-100 overflow-x-auto"
    >
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        :class="[
          'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          activeFilter === tab.key
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
        @click="emit('update:activeFilter', tab.key)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
            activeFilter === tab.key ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600',
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table v-if="transactions.length > 0" class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">#</th>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 font-medium text-gray-600',
                alignClass(col.align),
                col.hideOnMobile ? 'hidden md:table-cell' : '',
              ]"
            >
              {{ col.label }}
            </th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">
              <slot name="action-header">จัดการ</slot>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(txn, idx) in displayedRows"
            :key="txn.id"
            :class="[
              'hover:bg-gray-50 transition-colors cursor-pointer',
              issuedIds?.[txn.id] ? 'bg-red-50 hover:bg-red-100' : '',
            ]"
            @click="emit('row-click', txn)"
          >
            <!-- Row number -->
            <td class="px-4 py-3 text-gray-500">
              {{ effectiveOffset + (idx as number) + 1 }}
            </td>

            <!-- Data columns -->
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3',
                alignClass(col.align),
                col.hideOnMobile ? 'hidden md:table-cell' : '',
                col.tdClass ?? '',
              ]"
              @click="col.component ? $event.stopPropagation() : undefined"
            >
              <!-- Custom slot renderer -->
              <slot
                v-if="col.component"
                :name="`col-${col.component}`"
                :row="txn"
                :value="txn[col.key]"
              />
              <!-- Simple formatter or raw value -->
              <template v-else>
                {{ col.formatter ? col.formatter(txn[col.key], txn) : txn[col.key] }}
              </template>
            </td>

            <!-- Actions column -->
            <td class="px-4 py-3 text-center" @click.stop>
              <div class="flex items-center justify-center gap-1">
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

      <!-- Empty state -->
      <slot v-if="transactions.length === 0" name="empty">
        <EmptyState
          icon="📋"
          title="ยังไม่มีรายการ"
          :description="emptyMessage ?? 'ไม่มีรายการธุรกรรมสำหรับวันที่เลือก'"
        />
      </slot>
    </div>

    <!-- Built-in Pagination -->
    <div
      v-if="showPagination && totalPages > 1"
      class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50"
    >
      <button
        class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
        :class="
          currentPage === 1
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-white'
        "
        :disabled="currentPage === 1"
        @click="goToPrev"
      >
        &lt; ก่อนหน้า
      </button>
      <span class="text-sm text-gray-600">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
      <button
        class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
        :class="
          currentPage === totalPages
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-white'
        "
        :disabled="currentPage === totalPages"
        @click="goToNext"
      >
        ถัดไป &gt;
      </button>
    </div>
  </div>
</template>
