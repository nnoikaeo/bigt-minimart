/**
 * Returns the current logged-in user's uid and displayName from the auth store.
 * Used in: any page that records transactions (transaction-recording.vue, etc.)
 */
export function useCurrentUser() {
  const authStore = useAuthStore()

  const currentUser = computed(() => ({
    uid: authStore.user?.uid ?? '',
    displayName: authStore.user?.displayName ?? 'Unknown',
  }))

  return { currentUser }
}
