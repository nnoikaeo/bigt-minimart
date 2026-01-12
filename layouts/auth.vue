<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-4">
    <!-- Auth Layout - Minimal, no sidebar, header, or footer -->
    <slot />
  </div>
</template>

<script setup lang="ts">
// Auth layout - ไม่มี header, sidebar, footer
// เฉพาะแสดง content ตรงกลาง (for login, signup, etc.)
</script>

<style scoped>
/* Minimal styling for auth layout */
</style>
