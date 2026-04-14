/* eslint-disable */
// @ts-nocheck
/**
 * Shared helpers for workflow integration tests.
 *
 * Simulates the server-side repository by keeping an in-memory state object
 * that responds to $fetch calls. This lets us test the full workflow
 * (Step 1 → Step 2 → Audit → Approval) at the store layer without spinning
 * up real API handlers.
 */
import { vi } from 'vitest'

export interface ServerState {
  summary: any | null
  transactions: any[]
  balance: any
}

export function createServerState(overrides: Partial<ServerState> = {}): ServerState {
  return {
    summary: null,
    transactions: [],
    balance: {
      date: '2026-04-14',
      bankAccount: 10000,
      billPaymentCash: 0,
      serviceFeeCash: 0,
      openingBalanceSource: 'manual',
    },
    ...overrides,
  }
}

/**
 * Build a $fetch mock that reads/writes the given server state.
 * Routes are matched by URL substring.
 *
 * `handlers` maps route pattern → handler(body, params, url) → response
 * The returned response is wrapped as `{ data: ... }` to mimic API format.
 */
export function createFetchMock(
  state: ServerState,
  handlers: Record<string, (body: any, params: any, url: string) => any>,
) {
  return vi.fn(async (url: string, options: any = {}) => {
    const body = options?.body ?? {}
    const params = options?.params ?? {}

    // Match by the most-specific pattern first
    const sorted = Object.entries(handlers).sort((a, b) => b[0].length - a[0].length)
    for (const [pattern, handler] of sorted) {
      if (url.includes(pattern)) {
        const result = handler(body, params, url)
        return { data: result, success: true }
      }
    }
    // Unknown endpoints: return null data
    return { data: null, success: true }
  })
}
