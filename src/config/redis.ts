import { getEnv } from '../config'
import type { RedisConfig } from './types'

/**
 * Gets Redis configuration from validated environment
 */
export function getRedisConfig(): RedisConfig {
  const env = getEnv()
  
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT
  }
} 