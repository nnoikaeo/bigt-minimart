/**
 * Test endpoint - simple response
 */

export default defineEventHandler(async (event) => {
  console.log('[TEST] Endpoint called')
  return {
    success: true,
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString(),
  }
})
