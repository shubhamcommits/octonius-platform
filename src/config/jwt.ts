import { getEnv } from '../config'
import type { JWTConfig } from './types'

/**
 * Gets JWT configuration from validated environment
 */
export function getJWTConfig(): JWTConfig {
  const env = getEnv()
  
  return {
    accessKey: env.JWT_ACCESS_KEY,
    accessTime: env.JWT_ACCESS_TIME
  }
} 