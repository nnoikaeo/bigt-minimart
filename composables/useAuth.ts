import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore()
  const router = useRouter()

  // Get auth from Firebase plugin
  const getAuth = () => {
    return nuxtApp.$auth
  }

  // Helper function to extract role from displayName (for testing)
  const extractRoleFromDisplayName = (displayName: string | null): string => {
    if (!displayName) return 'unknown'
    
    const roleMap: Record<string, string> = {
      'เจ้าของร้าน': 'owner',
      'ผู้จัดการร้าน': 'manager',
      'ผู้จัดการ': 'manager',
      'พนักงานสาเหตุ': 'auditor',
      'ออดิท': 'auditor',
      'auditor': 'auditor',
      'พนักงานคิดเงิน': 'cashier',
      'cashier': 'cashier',
    }
    
    return roleMap[displayName] || 'unknown'
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const $auth = getAuth()
      const $db = useNuxtApp().$db
      
      if (!$auth) {
        return { 
          success: false, 
          error: 'Firebase ไม่พร้อม',
          code: 'firebase-not-ready'
        }
      }

      const userCredential = await signInWithEmailAndPassword(
        $auth as any,
        email,
        password
      )
      
      const user = userCredential.user
      
      // Fetch user role from Firestore (Hybrid Approach)
      let userRole = 'unknown'
      let userRoles: string[] = []
      let userPrimaryRole: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor' | 'unknown' = 'unknown'
      let userIsActive = false
      let userDisplayName = user.displayName || 'User'
      
      if ($db) {
        try {
          const userDocRef = doc($db as any, 'users', user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data()
            userRole = firestoreData?.primaryRole || 'unknown'
            userRoles = firestoreData?.roles || []
            userPrimaryRole = firestoreData?.primaryRole || 'unknown'
            userIsActive = firestoreData?.isActive ?? true
            userDisplayName = firestoreData?.displayName || user.displayName || 'User'
            console.log('[Auth] Fetched from Firestore:', { role: userRole, roles: userRoles, primaryRole: userPrimaryRole, isActive: userIsActive, displayName: userDisplayName })
          } else {
            console.warn('[Auth] No user document in Firestore for UID:', user.uid)
            userRole = extractRoleFromDisplayName(user.displayName)
          }
        } catch (error: any) {
          console.error('[Auth] Error fetching from Firestore:', error.message)
          userRole = extractRoleFromDisplayName(user.displayName)
        }
      } else {
        // Fallback if Firestore not available
        userRole = extractRoleFromDisplayName(user.displayName)
      }
      
      // Store user info in auth store
      authStore.setUser({
        uid: user.uid,
        email: user.email,
        displayName: userDisplayName,
        primaryRole: userPrimaryRole,
        roles: userRoles,
        isActive: userIsActive,
      })

      console.log('[Auth] Login successful:', user.email, '| role:', userRole, '| roles:', userRoles)
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
        await signOut($auth as any)
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
      const $db = useNuxtApp().$db
      
      if (!$auth) {
        console.warn('[Auth] Firebase not available for state watching')
        return () => {} // Return dummy unsubscribe
      }

      return onAuthStateChanged($auth as any, async (user) => {
        if (user) {
          console.log('[Auth] User logged in:', user.email)
          
          // Fetch user role from Firestore (Hybrid Approach)
          let userRole = 'unknown'
          let userRoles: string[] = []
          let userPrimaryRole: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor' | 'unknown' = 'unknown'
          let userIsActive = false
          
          if ($db) {
            try {
              const userDocRef = doc($db as any, 'users', user.uid)
              const userDocSnap = await getDoc(userDocRef)
              if (userDocSnap.exists()) {
                const firestoreData = userDocSnap.data()
                userRole = firestoreData?.primaryRole || 'unknown'
                userRoles = firestoreData?.roles || []
                userPrimaryRole = firestoreData?.primaryRole || 'unknown'
                userIsActive = firestoreData?.isActive ?? true
              } else {
                console.warn('[Auth] No user document in Firestore for UID:', user.uid)
                userRole = extractRoleFromDisplayName(user.displayName)
              }
            } catch (error: any) {
              console.error('[Auth] Error fetching from Firestore:', error.message)
              userRole = extractRoleFromDisplayName(user.displayName)
            }
          } else {
            // Fallback if Firestore not available
            userRole = extractRoleFromDisplayName(user.displayName)
          }
          
          authStore.setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            roles: userRoles as any,
            primaryRole: userPrimaryRole,
            isActive: userIsActive,
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
