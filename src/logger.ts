import winston from 'winston'
import { isLocal, isDevelopment } from './config'

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

// Helper to pretty-print JSON with color for console
const prettyJsonFormat = winston.format.printf((info) => {

    // Prepare the log object
    const logObject: Record<string, any> = {
        timestamp: info.timestamp,
        message: info.message,
        level: info.level,
        service: info.service,
    }

    // Attach context if present
    if (info.context) {
        logObject.context = info.context
    }

    // Attach all other metadata
    const metadata: Record<string, any> = { ...info }
    delete metadata.timestamp
    delete metadata.level
    delete metadata.message
    delete metadata.service
    delete metadata.context

    // Attach metadata if present
    if (Object.keys(metadata).length > 0) {
        logObject.metadata = metadata
    }

    // Colorize the level
    let colorized = JSON.stringify(logObject, null, 2)

    // Colorize the whole output based on level
    switch (info.level) {
        case 'error':
            colorized = `\x1b[31m${colorized}\x1b[0m`
            break
        case 'warn':
            colorized = `\x1b[33m${colorized}\x1b[0m`
            break
        case 'info':
            colorized = `\x1b[32m${colorized}\x1b[0m`
            break
        case 'http':
            colorized = `\x1b[35m${colorized}\x1b[0m`
            break
        case 'debug':
            colorized = `\x1b[36m${colorized}\x1b[0m`
            break
        default:
            break
    }

    // Return the colorized log
    return colorized
})

// Compact JSON for files
const compactJsonFormat = winston.format.printf((info) => {
    const logObject: Record<string, any> = {
        timestamp: info.timestamp,
        message: info.message,
        level: info.level,
        service: info.service,
    }
    if (info.context) {
        logObject.context = info.context
    }
    const metadata: Record<string, any> = { ...info }
    delete metadata.timestamp
    delete metadata.level
    delete metadata.message
    delete metadata.service
    delete metadata.context
    if (Object.keys(metadata).length > 0) {
        logObject.metadata = metadata
    }
    return JSON.stringify(logObject)
})

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    defaultMeta: {
        service: 'octonius-platform'
    },
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        winston.format.printf((info) => {
            // Prepare the log object
            const logObject: Record<string, any> = {
                timestamp: info.timestamp,
                message: info.message,
                level: info.level,
                service: info.service,
            }
            // Attach context if present
            if (info.context) {
                logObject.context = info.context
            }
            // Attach all other metadata
            const metadata: Record<string, any> = { ...info }
            delete metadata.timestamp
            delete metadata.level
            delete metadata.message
            delete metadata.service
            delete metadata.context
            if (Object.keys(metadata).length > 0) {
                logObject.metadata = metadata
            }
            return JSON.stringify(logObject)
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
                (isLocal())
                    ? prettyJsonFormat
                    : compactJsonFormat
            )
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
                compactJsonFormat
            )
        }),
        new winston.transports.File({
            filename: 'logs/all.log',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
                compactJsonFormat
            )
        }),
    ],
})

// Export the logger
export default logger

// Export a function to update logger level based on environment
export function updateLoggerLevel() {
    const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    logger.level = level
    logger.info(`Logger level set to: ${level}`)
}

// Export a function to log messages with metadata
export function appLogger(message: string, metadata?: any) {
    if (metadata?.level) {
        logger.log(metadata.level, message, { ...metadata, context: 'application' })
    } else {
        logger.info(message, { ...metadata, context: 'application' })
    }
}

// Export a function to log database messages
export function dbLogger(message: string, metadata?: any) {
    logger.info(message, { ...metadata, context: 'database' })
}

// Export a function to log redis messages
export function redisLogger(message: string, metadata?: any) {
    logger.info(message, { ...metadata, context: 'redis' })
}

// Export a function to log aws messages
export function awsLogger(message: string, metadata?: any) {
    logger.info(message, { ...metadata, context: 'aws' })
}