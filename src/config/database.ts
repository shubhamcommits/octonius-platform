import { getEnv } from '../config'
import type { DatabaseConfig } from './types'

/**
 * Gets database configuration from validated environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const env = getEnv()
  
  return {
    writer: {
      host: env.DB_WRITER_HOST,
      port: env.DB_PORT,
      username: env.DB_USER,
      password: env.DB_PASS,
      database: env.DB_NAME
    },
    reader: {
      host: env.DB_READER_HOST,
      port: env.DB_PORT,
      username: env.DB_USER,
      password: env.DB_PASS,
      database: env.DB_NAME
    },
    pool: {
      max: env.MAX_POOL,
      min: env.MIN_POOL
    }
  }
} 