/**
 * Returns $apiFetch (adds the Firebase ID token as `Authorization: Bearer …`,
 * see plugins/apiFetch.client.ts) when running in the browser,
 * and falls back to $fetch in SSR / tests (finance APIs are called client-side).
 *
 * Used by the money-transfer and bill-payment stores.
 */
export function getApiFetch(): typeof $fetch {
  if (process.client) {
    const { $apiFetch } = useNuxtApp()
    if ($apiFetch) return $apiFetch as typeof $fetch
  }
  return $fetch
}
