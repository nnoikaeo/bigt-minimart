// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false, // Disable for now
  },

  // Pages - Enable auto-routing
  pages: true,

  // Nitro - Configure for static generation
  nitro: {
    prerender: {
      crawlLinks: false,  // Don't crawl links to avoid protected routes
      routes: ['/login', '/setup'],  // Only truly public pages (not home /)
    },
  },

  // Runtime Config - Auto-load from .env files
  runtimeConfig: {
    // Private keys (server-only)
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '{}',

    // Public keys (client + server) - Load from environment variables
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || '',
    },
  },

  // PostCSS
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Build
  build: {
    transpile: ['@heroicons/vue'],
  },

  // App Config
  app: {
    head: {
      title: 'BigT Minimart Management System',
      meta: [
        { name: 'description', content: 'ระบบจัดการร้านบิ๊กธี มินิมาร์ท' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
      ],
    },
  },
})
