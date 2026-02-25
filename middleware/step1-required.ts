import { useMoneyTransferStore } from '~/stores/money-transfer'

/**
 * Route guard: ensure Step 1 is completed before accessing Step 2 (cash-counting)
 * If not complete, redirects back to transaction-recording with a notice query param
 */
export default defineNuxtRouteMiddleware(async () => {
  // Skip on SSR — store is not available
  if (process.server) return

  const store = useMoneyTransferStore()
  const today = new Date().toISOString().split('T')[0]

  // Fetch summary if not yet loaded (e.g. direct URL access / bookmark)
  if (!store.currentSummary) {
    try {
      await store.fetchDailySummary(today)
    } catch {
      // Fetch failed — redirect conservatively
    }
  }

  if (!store.isStep1Complete) {
    return navigateTo(
      '/finance/money-transfer-service/transaction-recording?notice=step1_required',
      { replace: true }
    )
  }
})
