/**
 * Provides $apiFetch — a $fetch instance that automatically attaches the
 * current Firebase ID token as `Authorization: Bearer <token>`.
 *
 * Used by Pinia stores (bill-payment, money-transfer) so every API mutation
 * is authenticated without each store managing token retrieval manually.
 */
export default defineNuxtPlugin(() => {
  const apiFetch = $fetch.create({
    onRequest: async ({ options }) => {
      // Resolve $auth at request time — firebase.client.ts may not have run yet at plugin init
      const { $auth } = useNuxtApp()
      const auth = $auth as any
      if (!auth?.currentUser) return

      try {
        const token: string = await auth.currentUser.getIdToken()
        // Merge with any headers the caller already set
        const existing: Record<string, string> =
          options.headers instanceof Headers
            ? Object.fromEntries((options.headers as Headers).entries())
            : ((options.headers as Record<string, string>) ?? {})
        options.headers = new Headers({ ...existing, Authorization: `Bearer ${token}` })
      } catch (err) {
        console.warn('[apiFetch] Could not get Firebase ID token:', err)
      }
    },
  })

  return { provide: { apiFetch } }
})
