import { appLogger } from '../logger'
import { envSchema, type EnvConfig } from './types'

let validatedConfig: EnvConfig | null = null

/**
 * Validates and returns the environment configuration
 * @throws {Error} If environment validation fails
 */
export function validateEnv(): EnvConfig {
  if (validatedConfig) {
    return validatedConfig
  }

  try {
    validatedConfig = envSchema.parse(process.env)
    
    appLogger('Environment validation successful', {
      environment: process.env.NODE_ENV,
      totalVariables: Object.keys(validatedConfig).length
    })

    // Log present variables (with masked secrets)
    Object.entries(validatedConfig).forEach(([name, value]) => {
      const isSecret = name.toLowerCase().includes('key') || 
                      name.toLowerCase().includes('pass') || 
                      name.toLowerCase().includes('secret')
      
      const maskedValue = isSecret 
        ? String(value).substring(0, 4) + '****' + String(value).substring(String(value).length - 4)
        : value

      appLogger(`ENV`, {
        name: name,
        value: maskedValue,
        level: 'debug'
      })
    })

    return validatedConfig
  } catch (error) {
    appLogger('ENV validation failed', {
      level: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Gets the validated environment configuration
 * @throws {Error} If environment hasn't been validated
 */
export function getEnv(): EnvConfig {
  if (!validatedConfig) {
    throw new Error('Environment not validated. Call validateEnv() first.')
  }
  return validatedConfig
}

/**
 * Checks if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'prod'
}

/**
 * Checks if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'dev'
} 