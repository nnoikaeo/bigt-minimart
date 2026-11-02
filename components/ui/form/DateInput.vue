<script setup lang="ts">
/**
 * Date picker showing dd/mm/พ.ศ. A native date input follows the browser's language
 * and cannot show Buddhist years, so it sits invisibly over the formatted text and
 * keeps handling selection. The value stays ISO (YYYY-MM-DD).
 */
import { computed, ref } from 'vue'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import { formatThaiDate } from '~/utils/date'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    modelValue: '',
    disabled: false,
    size: 'md',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const input = ref<HTMLInputElement | null>(null)
const displayText = computed(() => (props.modelValue ? formatThaiDate(props.modelValue) : 'วว/ดด/ปปปป'))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function onChange(event: Event) {
  emit('change', (event.target as HTMLInputElement).value)
}

function openPicker() {
  if (props.disabled) return
  try {
    input.value?.showPicker()
  } catch {
    // Older browsers have no showPicker; the input still takes keyboard entry
  }
}
</script>

<template>
  <div class="relative">
    <input
      ref="input"
      type="date"
      :value="modelValue"
      :disabled="disabled"
      class="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      @input="onInput"
      @change="onChange"
      @click="openPicker"
    />
    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-gray-300 text-sm peer-focus:border-red-500 peer-focus:ring-2 peer-focus:ring-red-100"
      :class="[
        size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2',
        disabled ? 'bg-gray-100 text-gray-500' : 'bg-white',
        !disabled && !modelValue ? 'text-gray-500' : '',
        !disabled && modelValue ? 'text-gray-900' : '',
      ]"
    >
      <span class="whitespace-nowrap">{{ displayText }}</span>
      <CalendarIcon class="h-4 w-4 shrink-0 text-gray-500" />
    </div>
  </div>
</template>
