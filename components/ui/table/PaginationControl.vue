<script setup lang="ts">
/**
 * PaginationControl Component
 *
 * Reusable pagination control with page size selector, navigation buttons, and page info
 * Can be used independently or within table components
 *
 * @example
 * <PaginationControl
 *   v-model:currentPage="currentPage"
 *   v-model:pageSize="pageSize"
 *   :totalPages="totalPages"
 *   :totalItems="totalItems"
 * />
 */

import { ref, computed } from 'vue'

interface Props {
  /** Current page number */
  currentPage: number
  /** Items per page */
  pageSize: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  totalItems: number
  /** Show pagination when enabled */
  pagination?: boolean
}

interface Emits {
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}

const props = withDefaults(defineProps<Props>(), {
  pagination: true,
})

const emit = defineEmits<Emits>()

// Page size options
const pageSizeOptions = [10, 25, 50]

/**
 * Handle page size change
 */
const handlePageSizeChange = (newSize: number) => {
  emit('update:pageSize', newSize)
  // Reset to page 1 when page size changes
  emit('update:currentPage', 1)
}

/**
 * Handle previous page
 */
const goToPrevious = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

/**
 * Handle next page
 */
const goToNext = () => {
  if (props.currentPage < props.totalPages) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

/**
 * Go to specific page
 */
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div v-if="pagination" class="flex items-center justify-between px-4 py-4 gap-4">
    <!-- Left: Items per page dropdown -->
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600">รายการต่อหน้า:</label>
      <select
        :value="pageSize"
        @change="handlePageSizeChange(Number(($event.target as HTMLSelectElement).value))"
        class="px-3 py-1 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </div>

    <!-- Middle: Page navigation -->
    <div class="flex items-center gap-2">
      <button
        @click="goToPrevious"
        :disabled="currentPage === 1"
        class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← ก่อนหน้า
      </button>

      <!-- Page numbers -->
      <div class="flex gap-1">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-1 text-sm font-medium rounded',
            currentPage === page
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="goToNext"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ถัดไป →
      </button>
    </div>

    <!-- Right: Page info -->
    <div class="text-sm text-gray-600 whitespace-nowrap">
      หน้า {{ currentPage }} / {{ totalPages }}
      <span class="ml-2">({{ totalItems }} รายการ)</span>
    </div>
  </div>
</template>
