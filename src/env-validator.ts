import { appLogger } from './logger'

interface EnvironmentVariable {
    name: string
    required: boolean
    source: 'plain' | 'secret'
    defaultValue?: string
}

// Define all environment variables and their sources
const environmentVariables: EnvironmentVariable[] = [
    
    // Plain text environment variables (from Terraform environment_variables)
    { name: 'HOST', required: true, source: 'plain' },
    { name: 'APP_NAME', required: true, source: 'plain' },
    { name: 'PORT', required: true, source: 'plain' },
    { name: 'NODE_ENV', required: true, source: 'plain' },
    { name: 'CLUSTER', required: true, source: 'plain' },
    { name: 'DOMAIN', required: true, source: 'plain' },
    { name: 'AWS_ACCOUNT_NUMBER', required: true, source: 'plain' },
    { name: 'AWS_DEFAULT_REGION', required: true, source: 'plain' },
    { name: 'DB_WRITER_HOST', required: true, source: 'plain' },
    { name: 'DB_READER_HOST', required: true, source: 'plain' },
    { name: 'DB_PORT', required: true, source: 'plain' },
    { name: 'DB_NAME', required: true, source: 'plain' },
    { name: 'DB_USER', required: true, source: 'plain' },
    { name: 'MAX_POOL', required: true, source: 'plain' },
    { name: 'MIN_POOL', required: true, source: 'plain' },
    { name: 'REDIS_HOST', required: true, source: 'plain' },
    { name: 'REDIS_PORT', required: true, source: 'plain' },
    
    // Secret environment variables (from Terraform environment_secrets)
    { name: 'AWS_ACCESS_KEY_ID', required: true, source: 'secret' },
    { name: 'AWS_SECRET_ACCESS_KEY', required: true, source: 'secret' },
    { name: 'JWT_ACCESS_KEY', required: true, source: 'secret' },
    { name: 'JWT_ACCESS_TIME', required: true, source: 'secret' },
    { name: 'DB_PASS', required: true, source: 'secret' },
]

/**
 * Validates that all required environment variables are present
 * @returns {boolean} - True if all required variables are present
 */
export function validateEnvironmentVariables(): boolean {
    let isValid = true
    const missingVariables: string[] = []
    const presentVariables: { [key: string]: { source: string, value: string } } = {}

    appLogger('Starting environment variable validation', {
        totalVariables: environmentVariables.length,
        environment: process.env.NODE_ENV
    })

    for (const envVar of environmentVariables) {
        const value = process.env[envVar.name]
        
        if (!value && envVar.required) {
            missingVariables.push(`${envVar.name} (${envVar.source})`)
            isValid = false
        } else if (value) {
            // Mask sensitive values
            const maskedValue = envVar.source === 'secret' 
                ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
                : value
            
            presentVariables[envVar.name] = {
                source: envVar.source,
                value: maskedValue
            }
        }
    }

    // Log validation results
    if (missingVariables.length > 0) {
        appLogger('Environment validation failed - missing variables', {
            level: 'error',
            missingVariables,
            missingCount: missingVariables.length
        })
    }

    appLogger('Environment validation summary', {
        isValid,
        presentCount: Object.keys(presentVariables).length,
        missingCount: missingVariables.length,
        environment: process.env.NODE_ENV
    })

    // Log present variables (with masked secrets)
    Object.entries(presentVariables).forEach(([name, info]) => {
        appLogger(`Environment variable loaded: ${name}`, {
            source: info.source,
            value: info.value,
            level: 'debug'
        })
    })

    return isValid
}

/**
 * Gets environment variable with fallback
 * @param name - The environment variable name
 * @param defaultValue - The default value if not found
 * @returns The environment variable value or default
 */
export function getEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name]
    if (!value && !defaultValue) {
        appLogger(`Environment variable ${name} not found and no default provided`, {
            level: 'warn'
        })
    }
    return value || defaultValue || ''
}

/**
 * Checks if running in production
 * @returns True if in production environment
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production'
}

/**
 * Checks if running in development
 * @returns True if in development environment
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local'
}

/**
 * Gets database configuration from environment
 * @returns Database configuration object
 */
export function getDatabaseConfig() {
    return {
        writer: {
            host: getEnvVar('DB_WRITER_HOST'),
            port: parseInt(getEnvVar('DB_PORT', '5432')),
            username: getEnvVar('DB_USER'),
            password: getEnvVar('DB_PASS'),
            database: getEnvVar('DB_NAME')
        },
        reader: {
            host: getEnvVar('DB_READER_HOST'),
            port: parseInt(getEnvVar('DB_PORT', '5432')),
            username: getEnvVar('DB_USER'),
            password: getEnvVar('DB_PASS'),
            database: getEnvVar('DB_NAME')
        },
        pool: {
            max: parseInt(getEnvVar('MAX_POOL', '5')),
            min: parseInt(getEnvVar('MIN_POOL', '0'))
        }
    }
}

/**
 * Gets Redis configuration from environment
 * @returns Redis configuration object
 */
export function getRedisConfig() {
    return {
        host: getEnvVar('REDIS_HOST'),
        port: parseInt(getEnvVar('REDIS_PORT', '6379'))
    }
}

/**
 * Gets AWS configuration from environment
 * @returns AWS configuration object
 */
export function getAWSConfig() {
    return {
        region: getEnvVar('AWS_DEFAULT_REGION', 'eu-central-1'),
        credentials: {
            accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID'),
            secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY')
        },
        accountNumber: getEnvVar('AWS_ACCOUNT_NUMBER')
    }
}

/**
 * Gets JWT configuration from environment
 * @returns JWT configuration object
 */
export function getJWTConfig() {
    return {
        accessKey: getEnvVar('JWT_ACCESS_KEY'),
        accessTime: getEnvVar('JWT_ACCESS_TIME', '30d')
    }
} 