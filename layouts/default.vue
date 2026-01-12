<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header (full width, sticky at top) -->
    <Header />

    <!-- Main Content Area (flex row: sidebar + content) -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar (fixed left) -->
      <Sidebar />

      <!-- Main Content (flex column: content only) -->
      <div class="flex flex-col flex-1">
        <!-- Main Content (scrollable) -->
        <main class="flex-1 overflow-y-auto">
          <div class="px-6 py-8">
            <slot />
          </div>
        </main>
      </div>
    </div>

    <!-- Footer (full width, at bottom) -->
    <footer class="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
      <p>&copy; 2026 BigT Minimart. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Default layout with Header and Sidebar
// Used for authenticated pages (dashboard, admin pages, etc.)
</script>

<style scoped>
/* Scoped styles */</style>