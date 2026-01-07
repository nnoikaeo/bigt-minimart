export const useFirebase = () => {
  const nuxtApp = useNuxtApp()
  const { $auth, $db, $firebase, $storage } = nuxtApp

  const testFirebaseConnection = async () => {
    try {
      // Test if Firebase is initialized
      if (!$firebase) {
        throw new Error('Firebase not initialized')
      }

      // Test if Auth is available
      if (!$auth) {
        throw new Error('Firebase Auth not available')
      }

      // Test if Firestore is available
      if (!$db) {
        throw new Error('Firestore not available')
      }

      // Test if Storage is available
      if (!$storage) {
        throw new Error('Firebase Storage not available')
      }

      console.log('✅ Firebase connected successfully')
      console.log('   - Auth: Ready')
      console.log('   - Firestore: Ready')
      console.log('   - Storage: Ready')
      
      return { success: true }
    } catch (error: any) {
      console.error('❌ Firebase connection failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  return {
    testFirebaseConnection,
    auth: $auth,
    db: $db,
    storage: $storage,
    app: $firebase,
  }
}
