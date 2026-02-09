<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface Props {
  variant?: AlertVariant
  message?: string
  title?: string
  dismissible?: boolean
  autoClose?: boolean
  autoCloseDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: true,
  autoClose: false,
  autoCloseDuration: 3000,
})

const isVisible = ref(true)

const alertClasses = computed(() => {
  const base = 'rounded-lg border p-4 flex items-start gap-3'

  const variants = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return `${base} ${variants[props.variant]}`
})

const icons = {
  success: '✓',
  error: '⚠️',
  warning: '⚠️',
  info: 'ℹ️',
}

const close = () => {
  isVisible.value = false
}

onMounted(() => {
  if (props.autoClose) {
    setTimeout(() => {
      close()
    }, props.autoCloseDuration)
  }
})
</script>

<template>
  <transition
    name="fade"
    @leave="$emit('close')"
  >
    <div v-if="isVisible" :class="alertClasses" role="alert">
      <!-- Icon -->
      <span class="text-lg flex-shrink-0">
        {{ icons[variant] }}
      </span>

      <!-- Content -->
      <div class="flex-1">
        <p v-if="title" class="font-semibold">
          {{ title }}
        </p>
        <p v-if="message" :class="{ 'text-sm mt-1': title }">
          {{ message }}
        </p>
        <slot />
      </div>

      <!-- Close Button -->
      <button
        v-if="dismissible"
        @click="close"
        class="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close alert"
      >
        ✕
      </button>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
