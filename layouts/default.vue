<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-primary">
          🏪 BigT Minimart
        </h1>
        <div class="text-sm text-gray-600">
          {{ currentDate }}
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-50 border-t border-gray-200 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <p>&copy; 2026 BigT Minimart. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const currentDate = computed(() => {
  return dayjs().format('dddd D MMMM YYYY')
})
</script>

<style scoped>
/* Scoped styles */</style>