import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const config = useRuntimeConfig()

// Initialize only once
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(config.firebaseServiceAccount || '{}')),
    databaseURL: `https://${config.firebaseProjectId}.firebaseio.com`,
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
