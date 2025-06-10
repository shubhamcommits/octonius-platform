import winston from 'winston'

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
}

// Add colors to winston
winston.addColors(colors)

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    defaultMeta: {
        service: 'octonius-platform'
    },
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => {
            // Format the message with consistent spacing
            const message = info.message || '';
            const metadata: Record<string, any> = { ...info };
            delete metadata.timestamp;
            delete metadata.level;
            delete metadata.message;
            delete metadata.service;

            // Get context from metadata
            const context = metadata.context ? `[${metadata.context}]` : '';
            delete metadata.context;

            // Format message with label alignment if it contains a colon
            let formattedMessage = message;
            if (typeof message === 'string' && message.includes(':')) {
                const [label, content] = message.split(':').map((s: string) => s.trim());
                formattedMessage = `${label.padEnd(15)}: ${content}`;
            }

            // If there's metadata, format it with consistent spacing
            if (Object.keys(metadata).length > 0) {
                const formattedMetadata = Object.entries(metadata)
                    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                    .join(' | ');
                return `${info.timestamp} | ${context} | ${info.level} | ${formattedMessage} | ${formattedMetadata}`;
            }
            return `${info.timestamp} | ${context} | ${info.level} | ${formattedMessage}`;
        })
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