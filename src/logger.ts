import winston from 'winston'

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

// Define colors for each log level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
}

// Add colors to winston
winston.addColors(colors)

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    // Create a base message with timestamp and level
    let msg = `[${timestamp}] ${level.toUpperCase()}`

    // Add service name if available
    if (metadata.service) {
        msg += ` [${metadata.service}]`
    }

    // Add process ID if available
    if (metadata.pid) {
        msg += ` [PID: ${metadata.pid}]`
    }

    // Add the main message
    msg += `: ${message}`

    // Add any additional metadata
    if (Object.keys(metadata).length > 0) {
        const meta = { ...metadata }
        delete meta.service
        delete meta.pid
        if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`
        }
    }

    return msg
})

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    defaultMeta: {
        service: 'octonius-platform',
        pid: process.pid
    },
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.colorize({ all: true }),
        structuredFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/all.log' }),
    ],
})

// Create a stream object with a 'write' function that will be used by `morgan`
export const stream = {
    write: (message: string) => {
        logger.http(message.trim())
    },
}

// Helper function for database logs
export const dbLogger = (message: string, metadata?: any) => {
    logger.info(message, { ...metadata, service: 'database' })
}

// Helper function for redis logs
export const redisLogger = (message: string, metadata?: any) => {
    logger.info(message, { ...metadata, service: 'redis' })
}

// Helper function for application logs
export const appLogger = (message: string, metadata?: any) => {
    logger.info(message, { ...metadata, service: 'application' })
}

export default logger