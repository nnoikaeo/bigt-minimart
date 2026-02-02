/**
 * POST /api/admin/seed-firestore
 * Simplified endpoint that prepares Firestore data
 * In a real app, you would use Firebase Admin SDK here
 * For now, this provides the JSON data structure
 */

export default defineEventHandler(async (event) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
  
  console.log('[API:seed-firestore] Endpoint called, isDevelopment:', isDevelopment)
  
  if (!isDevelopment) {
    setResponseStatus(event, 403)
    return {
      success: false,
      error: 'Seed endpoint only available in development',
    }
  }

  try {
    console.log('[API:seed-firestore] Reading users from file...')
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    
    // Read users from public/data/users.json
    const filePath = join(process.cwd(), 'public', 'data', 'users.json')
    console.log('[API:seed-firestore] File path:', filePath)
    
    const fileContent = await readFile(filePath, 'utf-8')
    const users = JSON.parse(fileContent)
    console.log('[API:seed-firestore] Found', users.length, 'users in JSON file')

    if (!users || users.length === 0) {
      setResponseStatus(event, 400)
      return { 
        success: false, 
        error: 'No users found in public/data/users.json' 
      }
    }

    // Initialize Firebase Admin SDK
    console.log('[API:seed-firestore] Initializing Firebase Admin SDK...')
    const admin = await import('firebase-admin')
    
    let app
    try {
      app = admin.default.app()
      console.log('[API:seed-firestore] Using existing Firebase app')
    } catch (err) {
      console.log('[API:seed-firestore] Creating new Firebase app...')
      const credPath = join(process.cwd(), 'firebase-service-account.json')
      const serviceAccount = JSON.parse(await readFile(credPath, 'utf-8'))
      
      app = admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }, `seed-${Date.now()}`)
      console.log('[API:seed-firestore] Firebase app created')
    }

    // Get Firestore instance
    const db = admin.default.firestore(app)
    console.log('[API:seed-firestore] Got Firestore instance')

    // Clear existing users collection
    console.log('[API:seed-firestore] Clearing existing users...')
    const usersCollection = db.collection('users')
    const existingDocs = await usersCollection.get()
    let deletedCount = 0
    
    for (const doc of existingDocs.docs) {
      await doc.ref.delete()
      deletedCount++
    }
    console.log(`[API:seed-firestore] Deleted ${deletedCount} existing users`)

    // Write new users to Firestore
    console.log('[API:seed-firestore] Writing users to Firestore...')
    let createdCount = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        const userData = {
          email: user.email,
          displayName: user.displayName,
          primaryRole: user.primaryRole,
          roles: user.roles || [],
          isActive: user.isActive ?? true,
          createdAt: new Date(user.createdAt || Date.now()),
          updatedAt: new Date(user.updatedAt || Date.now()),
        }
        
        await usersCollection.doc(user.uid).set(userData)
        console.log(`[API:seed-firestore] ✓ Created: ${user.email}`)
        createdCount++
      } catch (err: any) {
        const errorMsg = `Failed to create ${user.email}: ${err.message}`
        console.error(`[API:seed-firestore] ✗ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`[API:seed-firestore] ✓ Seeding complete! ${createdCount}/${users.length} users created`)
    
    return {
      success: true,
      message: `Successfully seeded ${createdCount}/${users.length} users to Firestore`,
      data: {
        deleted: deletedCount,
        created: createdCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  } catch (err: any) {
    console.error('[API:seed-firestore] Error:', err.message)
    console.error('[API:seed-firestore] Stack:', err.stack)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: `Error: ${err.message}`,
    }
  }
})
