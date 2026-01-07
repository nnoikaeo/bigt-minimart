/**
 * Initialize test users in Firebase Auth using Firebase REST API
 * POST /api/init-users
 * 
 * This endpoint creates demo users for development/testing
 * Uses Firebase REST API (identitytoolkit) - no service account needed!
 */

const testUsers = [
  {
    email: 'owner@example.com',
    password: 'password123',
    displayName: 'เจ้าของร้าน',
    role: 'owner' as const
  },
  {
    email: 'manager@example.com',
    password: 'password123',
    displayName: 'ผู้จัดการร้าน',
    role: 'manager' as const
  },
  {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'พนักงานสาเหตุ',
    role: 'cashier' as const
  }
]

let initialized = false

/**
 * Create user via Firebase REST API
 * Uses the identitytoolkit endpoint (same as web SDK)
 */
async function createUserViaRestApi(
  email: string,
  password: string,
  displayName: string,
  apiKey: string
) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Check for specific error
      if (data.error?.message === 'EMAIL_EXISTS') {
        return {
          success: false,
          status: 'already-exists',
          email,
          message: 'User already exists'
        }
      }
      throw new Error(data.error?.message || `Firebase API error: ${response.status}`)
    }

    return {
      success: true,
      status: 'created',
      email,
      uid: data.localId,
      message: 'User created successfully'
    }
  } catch (error: any) {
    console.error(`❌ Error creating user ${email}:`, error.message)
    return {
      success: false,
      status: 'error',
      email,
      message: error.message
    }
  }
}

export default defineEventHandler(async (event) => {
  // Prevent multiple initialization attempts in same session
  if (initialized) {
    return {
      success: false,
      message: 'Users already initialized in this session',
      info: 'Reload page to initialize again',
      count: testUsers.length
    }
  }

  try {
    // Get Firebase API Key from runtime config
    const config = useRuntimeConfig()
    const apiKey = config.public.firebaseApiKey

    if (!apiKey) {
      console.error('❌ Missing NUXT_PUBLIC_FIREBASE_API_KEY environment variable')
      return {
        success: false,
        message: 'Firebase API key not configured',
        hint: 'Check .env.local file for firebaseApiKey'
      }
    }

    console.log('🔄 Initializing test users via Firebase REST API...')
    
    let createdCount = 0
    let existingCount = 0
    const results = []

    // Create each test user
    for (const user of testUsers) {
      console.log(`📝 Creating user: ${user.email}`)
      const result = await createUserViaRestApi(
        user.email,
        user.password,
        user.displayName,
        apiKey
      )

      results.push(result)

      if (result.status === 'created') {
        createdCount++
        console.log(`✅ Created user: ${user.email}`)
      } else if (result.status === 'already-exists') {
        existingCount++
        console.log(`⏭️ User already exists: ${user.email}`)
      } else {
        console.error(`❌ Failed to create user: ${user.email}`, result.message)
      }
    }

    initialized = true

    return {
      success: true,
      message: `Setup complete! Created ${createdCount} new users, ${existingCount} already existed`,
      createdCount,
      existingCount,
      totalAttempted: testUsers.length,
      results,
      nextStep: 'Go to /login and try logging in with one of the test credentials'
    }
  } catch (error: any) {
    console.error('❌ Error during user initialization:', error.message)
    return {
      success: false,
      error: error.message,
      hint: 'Check browser console for detailed error information',
      suggestion: 'Try creating users manually in Firebase Console if this fails'
    }
  }
})
