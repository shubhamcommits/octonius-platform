// Re-export all environment utilities
export * from '../env-validator'

// Environment variable names for easy reference
export const ENV_VARS = {
    // Application
    HOST: 'HOST',
    APP_NAME: 'APP_NAME',
    PORT: 'PORT',
    NODE_ENV: 'NODE_ENV',
    CLUSTER: 'CLUSTER',
    DOMAIN: 'DOMAIN',
    
    // AWS
    AWS_ACCOUNT_NUMBER: 'AWS_ACCOUNT_NUMBER',
    AWS_DEFAULT_REGION: 'AWS_DEFAULT_REGION',
    AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
    AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
    
    // Database
    DB_WRITER_HOST: 'DB_WRITER_HOST',
    DB_READER_HOST: 'DB_READER_HOST',
    DB_PORT: 'DB_PORT',
    DB_NAME: 'DB_NAME',
    DB_USER: 'DB_USER',
    DB_PASS: 'DB_PASS',
    MAX_POOL: 'MAX_POOL',
    MIN_POOL: 'MIN_POOL',
    
    // Redis
    REDIS_HOST: 'REDIS_HOST',
    REDIS_PORT: 'REDIS_PORT',
    
    // JWT
    JWT_ACCESS_KEY: 'JWT_ACCESS_KEY',
    JWT_ACCESS_TIME: 'JWT_ACCESS_TIME'
} as const 