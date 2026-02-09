import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (process.server) {
    console.log('[Firebase] Server-side detected, skipping Firebase initialization')
    nuxtApp.provide('firebase', null)
    nuxtApp.provide('auth', null)
    nuxtApp.provide('db', null)
    nuxtApp.provide('storage', null)
    return
  }

  // Try to get config from window.__NUXT__.config first (SSR hydration)
  // Then fall back to environment variables
  const apiKey = 'AIzaSyC4JW1puISdQKai5-2mEDyiIoWPrEw8kBA'
  const authDomain = 'bigt-minimart.firebaseapp.com'
  const projectId = 'bigt-minimart'
  const storageBucket = 'bigt-minimart.firebasestorage.app'
  const messagingSenderId = '863952831086'
  const appId = '1:863952831086:web:a0f7dcba644a45aa7f5c7f'

  // Check if Firebase config is available
  if (!apiKey || !projectId) {
    console.warn('[Firebase] Missing configuration')
    console.warn('FIREBASE_API_KEY:', apiKey ? '✓' : '✗')
    console.warn('FIREBASE_PROJECT_ID:', projectId ? '✓' : '✗')
    
    nuxtApp.provide('firebase', null)
    nuxtApp.provide('auth', null)
    nuxtApp.provide('db', null)
    nuxtApp.provide('storage', null)
    return
  }

  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    }

    console.log('[Firebase] Initializing with config:', { projectId, authDomain })

    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    
    // Initialize Firebase services
    const auth = getAuth(app)
    const db = getFirestore(app)
    const storage = getStorage(app)

    // Set auth to persistent
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('[Firebase] Failed to set persistence:', err)
    })

    console.log('[Firebase] ✅ Connected successfully')

    // Listen to auth state changes and update Pinia auth store
    const { useAuthStore } = await import('~/stores/auth')
    const authStore = useAuthStore()

    auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('[Firebase] Auth state changed:', firebaseUser?.uid || 'logged out')

      if (firebaseUser) {
        // User is logged in - get user details from access control
        try {
          const { useAccessControlStore } = await import('~/stores/access-control')
          const accessControlStore = useAccessControlStore()

          // Try to get user from access control store
          let user = accessControlStore.getUserById(firebaseUser.uid)

          if (!user) {
            // If not in access control, load the data first
            console.log('[Firebase] User not in access control, loading data...')
            await accessControlStore.loadAllData()
            user = accessControlStore.getUserById(firebaseUser.uid)
          }

          if (user) {
            console.log('[Firebase] Setting auth store user:', user.displayName)
            authStore.setUser({
              uid: user.uid,
              email: user.email || null,
              displayName: user.displayName || null,
              primaryRole: user.primaryRole as any,
              roles: user.roles,
              isActive: user.isActive,
            })
          } else {
            console.warn('[Firebase] User not found in access control:', firebaseUser.uid)
            // Still set basic user info from Firebase
            authStore.setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || null,
              displayName: firebaseUser.displayName || null,
              primaryRole: 'unknown',
            })
          }
        } catch (error) {
          console.error('[Firebase] Error setting user in auth store:', error)
          // Fallback: set basic Firebase user info
          authStore.setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            displayName: firebaseUser.displayName || null,
            primaryRole: 'unknown',
          })
        }
      } else {
        // User logged out
        console.log('[Firebase] User logged out')
        authStore.clearUser()
      }
    })

    nuxtApp.provide('firebase', app)
    nuxtApp.provide('auth', auth)
    nuxtApp.provide('db', db)
    nuxtApp.provide('storage', storage)
  } catch (error: any) {
    console.error('[Firebase] ❌ Initialization failed:', error.message)
    console.error('[Firebase] Details:', error)
    
    nuxtApp.provide('firebase', null)
    nuxtApp.provide('auth', null)
    nuxtApp.provide('db', null)
    nuxtApp.provide('storage', null)
  }
})