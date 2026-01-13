/**
 * Simple Logger Composable for debugging
 * Provides consistent logging format across the application
 */
export const useLogger = (module: string) => {
  const isDev = process.env.NODE_ENV === 'development'

  const log = (message: string, data?: any) => {
    if (isDev) {
      if (data !== undefined) {
        console.log(`[${module}] ${message}`, data)
      } else {
        console.log(`[${module}] ${message}`)
      }
    }
  }

  const info = (message: string, data?: any) => {
    if (isDev) {
      if (data !== undefined) {
        console.info(`ℹ [${module}] ${message}`, data)
      } else {
        console.info(`ℹ [${module}] ${message}`)
      }
    }
  }

  const warn = (message: string, data?: any) => {
    if (data !== undefined) {
      console.warn(`⚠ [${module}] ${message}`, data)
    } else {
      console.warn(`⚠ [${module}] ${message}`)
    }
  }

  const error = (message: string, data?: any) => {
    if (data !== undefined) {
      console.error(`❌ [${module}] ${message}`, data)
    } else {
      console.error(`❌ [${module}] ${message}`)
    }
  }

  const debug = (message: string, data?: any) => {
    if (isDev) {
      if (data !== undefined) {
        console.debug(`🔍 [${module}] ${message}`, data)
      } else {
        console.debug(`🔍 [${module}] ${message}`)
      }
    }
  }

  const table = (label: string, data: any) => {
    if (isDev) {
      console.log(`[${module}] ${label}:`)
      console.table(data)
    }
  }

  return {
    log,
    info,
    warn,
    error,
    debug,
    table,
  }
}
