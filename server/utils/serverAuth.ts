import type { H3Event } from 'h3'

export interface ServerAuthUser {
  uid: string
  email?: string
  name?: string
}

// Cached once per server process — null means Firebase Admin is not configured (dev mode)
let _cached: { adminAuth: any } | null = null

async function loadAdminAuth(): Promise<any | null> {
  if (_cached !== null) return _cached.adminAuth
  try {
    // Dynamic import catches the synchronous throw from firebase-admin.ts when
    // firebase-service-account.json is missing (e.g., local dev without credentials).
    const mod = await import('~/server/utils/firebase-admin')
    _cached = { adminAuth: mod.adminAuth }
  } catch {
    console.warn(
      '[serverAuth] Firebase Admin unavailable — service account not configured. ' +
      'Server-side token verification is DISABLED. ' +
      'Add firebase-service-account.json or set FIREBASE_SERVICE_ACCOUNT to enable.'
    )
    _cached = { adminAuth: null }
  }
  return _cached.adminAuth
}

/**
 * Require server-side authentication for a Nuxt API event.
 *
 * Production (Firebase Admin configured):
 *   Verifies the Firebase ID token from `Authorization: Bearer <token>`.
 *   Throws 401 if missing or invalid.
 *   Sets `event.context.user` with the verified identity.
 *
 * Development (no service account):
 *   Logs a warning, still requires the Authorization header as a sanity check,
 *   and returns a placeholder user so local dev is not blocked.
 *   This bypass is removed automatically once a service account is configured.
 */
export async function requireServerAuth(event: H3Event): Promise<ServerAuthUser> {
  const adminAuth = await loadAdminAuth()

  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!adminAuth) {
    // Dev bypass — still require the header so the client wires up auth correctly
    if (!token) {
      throw createError({ statusCode: 401, message: 'Authorization header required' })
    }
    const placeholder: ServerAuthUser = { uid: 'dev-unverified', name: 'Dev User' }
    event.context.user = placeholder
    return placeholder
  }

  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const user: ServerAuthUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name ?? decoded.email,
    }
    event.context.user = user
    return user
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
}
