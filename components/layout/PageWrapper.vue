<script setup lang="ts">
/**
 * PageWrapper Component
 *
 * Standard page container that wraps all page content
 * Includes: Breadcrumb, PageHeader, Loading/Error states, and main content area
 * Provides consistent styling and layout for all pages
 *
 * @example
 * <PageWrapper
 *   title="ยอดขาย"
 *   description="บันทึกและจัดการยอดขายรายวัน"
 *   icon="💰"
 *   :loading="isLoading"
 *   :error="error"
 * >
 *   <template #actions>
 *     <button class="btn btn-primary">เพิ่ม</button>
 *   </template>
 *
 *   <!-- Main content -->
 *   <div>Page content here...</div>
 * </PageWrapper>
 */

interface Props {
  /** Page title */
  title: string
  /** Page description (optional) */
  description?: string
  /** Emoji icon for page header (optional) */
  icon?: string
  /** Show loading state (optional) */
  loading?: boolean
  /** Error message to display (optional) */
  error?: string | null
  /** Show breadcrumb navigation (optional, default: true) */
  showBreadcrumb?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  showBreadcrumb: true,
})

defineSlots<{
  /** Header content slot - alternative to title/description */
  header(): any
  /** Action buttons slot - placed in page header */
  actions(): any
  /** Main content slot */
  default(): any
}>()
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb Navigation -->
      <Breadcrumb v-if="showBreadcrumb" class="py-4" />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingState />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-6 my-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-red-900">เกิดข้อผิดพลาด</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Page Content -->
      <template v-else>
        <!-- Custom header slot or default PageHeader -->
        <slot v-if="$slots.header" name="header" />
        <PageHeader
          v-else
          :title="title"
          :description="description"
          :icon="icon"
        >
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
        </PageHeader>

        <!-- Main Content -->
        <div class="py-8">
          <slot />
        </div>
      </template>
    </div>
  </div>
</template>
