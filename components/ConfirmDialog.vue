<script setup lang="ts">
/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog with customizable title, message, and actions
 * Replaces native browser confirm() dialog with a styled modal
 *
 * @example
 * <ConfirmDialog
 *   :open="showConfirm"
 *   title="ยืนยันการลบ"
 *   message="ยืนยันการลบรายการนี้หรือไม่?"
 *   confirm-text="ลบ"
 *   cancel-text="ยกเลิก"
 *   variant="danger"
 *   @confirm="handleDelete"
 *   @cancel="showConfirm = false"
 * />
 */

import { ref } from 'vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'ตกลง',
  cancelText: 'ยกเลิก',
  variant: 'warning',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isLoading = ref(false)

const handleConfirm = () => {
  isLoading.value = true
  try {
    emit('confirm')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const getButtonColor = () => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700'
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700'
    case 'success':
      return 'bg-green-600 hover:bg-green-700'
    case 'warning':
    default:
      return 'bg-orange-600 hover:bg-orange-700'
  }
}

const getIconColor = () => {
  switch (props.variant) {
    case 'danger':
      return 'text-red-600'
    case 'info':
      return 'text-blue-600'
    case 'success':
      return 'text-green-600'
    case 'warning':
    default:
      return 'text-orange-600'
  }
}

const getIcon = () => {
  switch (props.variant) {
    case 'danger':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    case 'success':
      return '✓'
    case 'warning':
    default:
      return '❓'
  }
}
</script>

<template>
  <Teleport v-if="open" to="body">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <!-- Dialog Container -->
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        <!-- Content Area -->
        <div class="p-6 space-y-4">
          <!-- Icon + Title -->
          <div class="flex items-start gap-3">
            <div :class="['flex-shrink-0 text-2xl', getIconColor()]">
              {{ getIcon() }}
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold text-gray-900">{{ title }}</h2>
            </div>
          </div>

          <!-- Message -->
          <p class="text-gray-600 text-sm leading-relaxed">{{ message }}</p>
        </div>

        <!-- Button Area -->
        <div class="flex gap-3 justify-end px-6 py-4 bg-gray-50 border-t">
          <button
            @click="handleCancel"
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="isLoading"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              getButtonColor(),
            ]"
          >
            <span v-if="isLoading">กำลังประมวลผล...</span>
            <span v-else>{{ confirmText }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoom-in-95 {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-in {
  animation: fade-in 150ms ease-out;
}

.fade-in {
  animation: fade-in 150ms ease-out;
}

.zoom-in-95 {
  animation: zoom-in-95 150ms ease-out;
}
</style>
