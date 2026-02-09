<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface Props {
  open: boolean
  title?: string
  size?: ModalSize
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlay: true,
  closeOnEsc: true,
})

const emit = defineEmits<{
  close: []
}>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEsc && props.open) {
    emit('close')
  }
}

// Register escape key listener when component mounts
const registerEscapeListener = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleEscapeKey)
  }
}

// Clean up listener
const unregisterEscapeListener = () => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleEscapeKey)
  }
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    registerEscapeListener()
  } else {
    unregisterEscapeListener()
  }
})

onMounted(() => {
  if (props.open) {
    registerEscapeListener()
  }
})

onUnmounted(() => {
  unregisterEscapeListener()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="handleOverlayClick"
      >
        <Transition name="modal-scale">
          <div
            v-if="open"
            :class="['bg-white rounded-lg shadow-xl w-full', sizeClasses[size]]"
            @click.stop
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'modal-title' : undefined"
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="border-b border-gray-200 px-6 py-4">
              <slot name="header">
                <div class="flex items-center justify-between">
                  <h2 id="modal-title" class="text-xl font-bold text-gray-900">
                    {{ title }}
                  </h2>
                  <button
                    aria-label="Close modal"
                    @click="emit('close')"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </slot>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="border-t border-gray-200 px-6 py-4">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 200ms ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
