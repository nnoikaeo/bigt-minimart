// import { initializeApp, cert, getApps } from 'firebase-admin/app'
// import { getAuth } from 'firebase-admin/auth'
// import { getFirestore } from 'firebase-admin/firestore'

// const config = useRuntimeConfig()

// // Initialize only once
// if (!getApps().length) {
//   initializeApp({
//     credential: cert(JSON.parse(config.firebaseServiceAccount || '{}')),
//     databaseURL: `https://${config.firebaseProjectId}.firebaseio.com`,
//   })
// }

// export const adminAuth = getAuth()
// export const adminDb = getFirestore()

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const config = useRuntimeConfig()

// Initialize only once
if (!getApps().length) {
  let serviceAccount

  try {
    // อ่าน Service Account จากไฟล์ JSON
    const serviceAccountPath = resolve('firebase-service-account.json')
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
  } catch (error) {
    console.error('❌ Error loading firebase-service-account.json:', error)
    throw new Error(
      'firebase-service-account.json not found. Please ensure the file exists in project root.'
    )
  }

  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${config.public.firebaseProjectId}.firebaseio.com`,
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
