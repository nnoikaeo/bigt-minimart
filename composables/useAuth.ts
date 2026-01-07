import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore()
  const router = useRouter()

  // Get auth from Firebase plugin
  const getAuth = () => {
    return nuxtApp.$auth
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const $auth = getAuth()
      
      if (!$auth) {
        return { 
          success: false, 
          error: 'Firebase ไม่พร้อม',
          code: 'firebase-not-ready'
        }
      }

      const userCredential = await signInWithEmailAndPassword(
        $auth,
        email,
        password
      )
      
      const user = userCredential.user
      
      // Store user info in auth store
      authStore.setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      })

      console.log('[Auth] Login successful:', user.email)
      return { success: true, user }
    } catch (error: any) {
      console.error('[Auth] Login failed:', error.code, error.message)
      const errorMessage = mapFirebaseError(error.code)
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
      }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const $auth = getAuth()
      
      if ($auth) {
        await signOut($auth)
      }
      
      authStore.clearUser()
      console.log('[Auth] Logout successful')
      return { success: true }
    } catch (error: any) {
      console.error('[Auth] Logout failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Watch auth state
  const watchAuthState = () => {
    try {
      const $auth = getAuth()
      
      if (!$auth) {
        console.warn('[Auth] Firebase not available for state watching')
        return () => {} // Return dummy unsubscribe
      }

      return onAuthStateChanged($auth, (user) => {
        if (user) {
          console.log('[Auth] User logged in:', user.email)
          authStore.setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
        } else {
          console.log('[Auth] User logged out')
          authStore.clearUser()
        }
      })
    } catch (error: any) {
      console.error('[Auth] Error setting up auth state watcher:', error.message)
      return () => {} // Return dummy unsubscribe
    }
  }

  // Helper function to map Firebase errors
  const mapFirebaseError = (code: string): string => {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'ไม่พบผู้ใช้นี้ในระบบ',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
      'auth/user-disabled': 'บัญชีนี้ถูกปิดใช้งาน',
      'auth/too-many-requests': 'ลองเข้าสู่ระบบมากเกินไป โปรดลองใหม่ภายหลัง',
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    }
    return errorMap[code] || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
  }

  return {
    login,
    logout,
    watchAuthState,
    getAuth,
  }
}
