import { z } from 'zod'

// Base environment schema
export const envSchema = z.object({
  // Server
  HOST: z.string(),
  APP_NAME: z.string(),
  PORT: z.string().transform(Number),
  NODE_ENV: z.enum(['dev', 'prod', 'test', 'local']),
  CLUSTER: z.string(),
  DOMAIN: z.string(),

  // AWS
  AWS_ACCOUNT_NUMBER: z.string(),
  AWS_DEFAULT_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),

  // Database
  DB_WRITER_HOST: z.string(),
  DB_READER_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASS: z.string(),
  MAX_POOL: z.string().transform(Number),
  MIN_POOL: z.string().transform(Number),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),

  // JWT
  JWT_ACCESS_KEY: z.string(),
  JWT_ACCESS_TIME: z.string(),

  // Resend
  RESEND_API_KEY: z.string(),
  SUPPORT_EMAIL: z.string(),
  RESEND_FROM_EMAIL: z.string()
})

// Infer the type from the schema
export type EnvConfig = z.infer<typeof envSchema>

// Database config type
export interface DatabaseConfig {
  writer: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  reader: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  pool: {
    max: number
    min: number
  }
}

// Redis config type
export interface RedisConfig {
  host: string
  port: number
}

// AWS config type
export interface AWSConfig {
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  accountNumber: string
}

// JWT config type
export interface JWTConfig {
  accessKey: string
  accessTime: string
} 