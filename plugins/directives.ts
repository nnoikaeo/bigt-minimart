/**
 * Vue Directives Plugin
 *
 * Registers custom directives for the application
 * Currently includes: v-can (permission-based rendering)
 */

import { defineNuxtPlugin } from '#app'
import type { DirectiveBinding } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAccessControlStore } from '~/stores/access-control'
import type { PermissionId, RoleId } from '~/types/permissions'

export default defineNuxtPlugin((nuxtApp) => {
  /**
   * v-can Directive
   *
   * Hides elements if user doesn't have the required permission
   * The element is completely hidden from the DOM (display: none)
   *
   * @usage
   * <!-- Hide if user doesn't have permission -->
   * <button v-can="PERMISSIONS.EDIT_SALES">Edit</button>
   *
   * <!-- Element hidden if user lacks permission -->
   * <div v-can="PERMISSIONS.DELETE_SALES" class="danger-zone">
   *   Danger actions
   * </div>
   */
  nuxtApp.vueApp.directive<HTMLElement, PermissionId>('can', {
    /**
     * Called when element is mounted
     */
    mounted(el: HTMLElement, binding: DirectiveBinding<PermissionId>) {
      const authStore = useAuthStore()
      const accessControlStore = useAccessControlStore()

      const permissionId = binding.value
      const userRole = authStore.user?.primaryRole

      // Check if user has permission
      const hasPermission = userRole && accessControlStore.hasPermission(userRole as RoleId, permissionId)

      if (!hasPermission) {
        // Hide element if no permission
        el.style.display = 'none'
      }
    },

    /**
     * Called when element's bindings are updated
     * This handles cases where permissions might change dynamically
     */
    updated(el: HTMLElement, binding: DirectiveBinding<PermissionId>) {
      const authStore = useAuthStore()
      const accessControlStore = useAccessControlStore()

      const permissionId = binding.value
      const userRole = authStore.user?.primaryRole

      // Check if user has permission
      const hasPermission = userRole && accessControlStore.hasPermission(userRole as RoleId, permissionId)

      if (!hasPermission) {
        el.style.display = 'none'
      } else {
        // Show element if permission exists
        el.style.display = ''
      }
    },
  })
})
