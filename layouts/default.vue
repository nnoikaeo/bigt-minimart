<template>
  <!-- OUTER CONTAINER: flex column, full screen height -->
  <div class="flex flex-col h-screen bg-gray-50">
    
    <!-- 1️⃣ HEADER: Full width, sticky at top -->
    <Header />
    
    <!-- 2️⃣ CONTENT AREA: flex row with sidebar + main (responsive) -->
    <div class="flex flex-1 relative overflow-hidden">
      <!-- Sidebar (hidden on mobile, visible on md and up) -->
      <Sidebar />
      
      <!-- Main Content (flex-1, responsive margin for sidebar) -->
      <main class="flex-1 overflow-y-auto ml-0 md:ml-64">
        <div class="px-4 py-6 sm:px-6 sm:py-8">
          <!-- Breadcrumb Navigation (responsive) -->
          <Breadcrumb />
          <slot />
        </div>
      </main>
    </div>
    
    <!-- 3️⃣ FOOTER: Full width, responsive padding -->
    <footer class="w-full bg-white border-t border-gray-200 py-3 px-4 sm:py-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500">
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