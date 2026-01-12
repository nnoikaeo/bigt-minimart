<template>
  <!-- OUTER CONTAINER: flex column, full screen height -->
  <div class="flex flex-col h-screen bg-gray-50">
    
    <!-- 1️⃣ HEADER: Full width, sticky at top -->
    <Header />
    
    <!-- 2️⃣ CONTENT AREA: flex row with sidebar + main -->
    <div class="flex flex-1 overflow-hidden relative">
      <!-- Sidebar (fixed left) -->
      <Sidebar />
      
      <!-- Main Content (direct child, with margin for sidebar) -->
      <main class="flex-1 overflow-y-auto ml-64">
        <div class="px-6 py-8">
          <slot />
        </div>
      </main>
    </div>
    
    <!-- 3️⃣ FOOTER: Full width, OUTSIDE flex container -->
    <footer class="w-full bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
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