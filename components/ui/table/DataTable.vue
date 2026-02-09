<script setup lang="ts">
/**
 * DataTable Component
 *
 * Advanced table component with sorting, pagination, and row selection
 * Built on top of BaseTable for additional functionality
 *
 * @example
 * <DataTable
 *   :data="sales"
 *   :columns="[
 *     { key: 'date', label: 'Date', sortable: true },
 *     { key: 'amount', label: 'Amount', align: 'right', sortable: true }
 *   ]"
 *   :pagination="true"
 *   :pageSize="10"
 * >
 *   <template #cell-amount="{ value }">
 *     {{ formatCurrency(value) }}
 *   </template>
 * </DataTable>
 */

import { computed, ref } from 'vue'

export interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any) => string | number
}

interface Props {
  /** Array of table data */
  data: any[]
  /** Column definitions */
  columns: DataTableColumn[]
  /** Unique key for each row */
  rowKey?: string
  /** Show loading state */
  loading?: boolean
  /** Empty message */
  emptyMessage?: string
  /** Enable pagination */
  pagination?: boolean
  /** Items per page */
  pageSize?: number
  /** Enable row selection with checkboxes */
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  loading: false,
  emptyMessage: 'ไม่มีข้อมูล',
  pagination: false,
  pageSize: 10,
  selectable: false,
})

const emit = defineEmits<{
  rowClick: [row: any]
  select: [selectedRows: any[]]
}>()

// Sorting state
const sortBy = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

// Pagination state
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)

// Selection state
const selectedRows = ref<Set<any>>(new Set())

/**
 * Handle column header click for sorting
 */
const handleSort = (column: DataTableColumn) => {
  if (!column.sortable) return

  if (sortBy.value === column.key) {
    // Toggle sort order
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, default to ascending
    sortBy.value = column.key
    sortOrder.value = 'asc'
  }
}

/**
 * Get sorted and paginated data
 */
const processedData = computed(() => {
  let result = [...props.data]

  // Apply sorting
  if (sortBy.value) {
    result.sort((a, b) => {
      const aVal = a[sortBy.value!]
      const bVal = b[sortBy.value!]

      // Handle different types
      if (typeof aVal === 'string') {
        return sortOrder.value === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      // Numeric comparison
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  return result
})

/**
 * Get paginated data
 */
const paginatedData = computed(() => {
  if (!props.pagination) return processedData.value

  const start = (currentPage.value - 1) * currentPageSize.value
  const end = start + currentPageSize.value
  return processedData.value.slice(start, end)
})

/**
 * Calculate total pages
 */
const totalPages = computed(() => {
  if (!props.pagination) return 1
  return Math.ceil(processedData.value.length / currentPageSize.value)
})

/**
 * Handle row selection
 */
const toggleRowSelection = (row: any) => {
  const key = row[props.rowKey]
  if (selectedRows.value.has(key)) {
    selectedRows.value.delete(key)
  } else {
    selectedRows.value.add(key)
  }
  emit('select', Array.from(selectedRows.value))
}

/**
 * Select all visible rows
 */
const selectAll = () => {
  paginatedData.value.forEach((row) => {
    selectedRows.value.add(row[props.rowKey])
  })
  emit('select', Array.from(selectedRows.value))
}

/**
 * Deselect all rows
 */
const deselectAll = () => {
  selectedRows.value.clear()
  emit('select', [])
}

/**
 * Check if row is selected
 */
const isRowSelected = (row: any): boolean => {
  return selectedRows.value.has(row[props.rowKey])
}

/**
 * Check if all visible rows are selected
 */
const allSelected = computed(() => {
  if (paginatedData.value.length === 0) return false
  return paginatedData.value.every((row) =>
    selectedRows.value.has(row[props.rowKey])
  )
})

/**
 * Get sort indicator for column
 */
const getSortIndicator = (column: DataTableColumn): string => {
  if (!column.sortable || sortBy.value !== column.key) return '⇅'
  return sortOrder.value === 'asc' ? '▲' : '▼'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Table Header -->
        <thead class="bg-gray-50">
          <tr>
            <!-- Selection checkbox header -->
            <th
              v-if="selectable"
              class="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider text-center w-12"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                @change="allSelected ? deselectAll() : selectAll()"
                class="rounded border-gray-300"
              />
            </th>

            <!-- Column headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider',
                column.align === 'center'
                  ? 'text-center'
                  : column.align === 'right'
                    ? 'text-right'
                    : 'text-left',
                column.width,
                column.sortable && 'cursor-pointer hover:bg-gray-100 transition-colors',
              ]"
              @click="handleSort(column)"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <span
                  v-if="column.sortable"
                  :class="[
                    'text-xs',
                    sortBy === column.key ? 'text-blue-600' : 'text-gray-400',
                  ]"
                >
                  {{ getSortIndicator(column) }}
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-6 py-8 text-center">
              <LoadingState text="กำลังโหลด..." />
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="!paginatedData || paginatedData.length === 0">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-6 py-8">
              <EmptyState
                :title="emptyMessage"
                icon="📊"
              />
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-for="(row, index) in paginatedData"
            v-else
            :key="row[rowKey] || index"
            class="hover:bg-gray-50 transition-colors"
          >
            <!-- Selection checkbox -->
            <td v-if="selectable" class="px-6 py-4 text-center w-12">
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                @change="toggleRowSelection(row)"
                class="rounded border-gray-300"
              />
            </td>

            <!-- Data cells -->
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-4 text-sm text-gray-900',
                column.align === 'center'
                  ? 'text-center'
                  : column.align === 'right'
                    ? 'text-right'
                    : 'text-left',
              ]"
              @click="emit('rowClick', row)"
            >
              <slot
                :name="`cell-${column.key}`"
                :value="column.formatter ? column.formatter(row[column.key]) : row[column.key]"
                :row="row"
                :column="column"
              >
                {{ column.formatter ? column.formatter(row[column.key]) : row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <PaginationControl
      :current-page="currentPage"
      :page-size="currentPageSize"
      :total-pages="totalPages"
      :total-items="processedData.length"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @update:page-size="currentPageSize = $event"
    />
  </div>
</template>
