// Import redis module
import { createClient } from 'redis'
// Import logger
import { redisLogger } from './logger'

// Create client
const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    socket: {
        reconnectStrategy: (retries) => {
            redisLogger('redis_reconnect_attempt', {
                attempt: retries,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT
            })
            if (retries > 10) {
                redisLogger('redis_reconnect_failed', {
                    level: 'error',
                    message: 'Retry attempts exhausted',
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT
                })
                return new Error('Retry attempts exhausted')
            }
            // Exponential backoff, max 3s
            return Math.min(retries * 100, 3000)
        },
        connectTimeout: 10000 // 10 seconds
    }
})

// Tracks if Redis is currently available
let redis_available = false
// Timestamp of the last error log (for throttling repeated logs)
let last_error_log_time = 0
// Throttle interval for error logs (in milliseconds)
const ERROR_LOG_THROTTLE_MS = 60000 // 60 seconds

/**
 * Checks if Redis is currently available.
 * @returns {boolean} True if Redis is available, false otherwise.
 */
export function isRedisAvailable() {
    return redis_available
}

/**
 * Establishes a connection to Redis. Uses built-in reconnect strategy.
 * Logs each connection attempt, error, and final status.
 * @returns {Promise<{ connection: typeof client } | { message: string, connected: boolean }>}
 */
export async function connectRedis() {
    redisLogger('redis_connection_initiated', {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    })

    // Attach error handler with throttled logging
    client.on('error', (err) => {
        const now = Date.now()
        if (now - last_error_log_time > ERROR_LOG_THROTTLE_MS) {
            redisLogger('redis_client_error', {
                level: 'error',
                error: err.message,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT
            })
            last_error_log_time = now
        }
    })

    try {
        await client.connect()
        redisLogger('redis_connected', {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        })
        redis_available = true
        return { connection: client }
    } catch (error: any) {
        redis_available = false
        redisLogger('redis_unavailable', {
            level: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        })
        return { message: 'redis_unavailable', connected: false }
    }
}

/**
 * Gracefully disconnects from Redis and updates availability state.
 * Logs the disconnection event.
 * @returns {Promise<void>}
 */
export async function disconnectRedis() {
    try {
        await client.quit()
        redis_available = false
        redisLogger('redis_disconnected', {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        })
    } catch (err: any) {
        redisLogger('redis_disconnect_error', {
            level: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        })
    }
}

/**
 * Deletes all Redis keys that match a given prefix.
 * Logs the number of deleted keys or any errors encountered.
 * @param {string} prefix - The prefix to match keys.
 * @returns {Promise<{ message: string, keys: string[] }>}
 */
export async function deleteRedisKeysByPrefix(prefix: string) {
    if (!client) {
        return { message: 'Redis client not initialized', keys: [] }
    }

    try {
        const keys = await client.keys(`${prefix}*`)
        if (keys.length > 0) {
            await client.del(keys)
            redisLogger(`Deleted ${keys.length} keys with prefix: ${prefix}`)
            return { message: `Deleted ${keys.length} keys with prefix: ${prefix}`, keys: keys }
        }
    } catch (error: any) {
        redisLogger('Error deleting keys', {
            level: 'error',
            prefix,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        return { message: `Error deleting Redis keys with prefix ${prefix}: ${error}`, keys: [] }
    }
    return { message: 'Delete operation completed', keys: [] }
}

/**
 * Fetches all Redis keys that match a given prefix using SCAN for efficiency.
 * Logs the number of fetched keys or any errors encountered.
 * @param {string} prefix - The prefix to search for.
 * @returns {Promise<{ message: string, keys: string[] }>}
 */
export async function fetchRedisKeysByPrefix(prefix: string): Promise<{ message: string, keys: string[] }> {
    try {
        let cursor = 0;
        const g_keys: string[] = [];

        do {
            const result = await client.scan(cursor, { MATCH: '*', COUNT: 100 });
            cursor = result.cursor;
            const keys = result.keys || [];

            if (keys.length > 0) {
                keys.forEach((key: string) => {
                    if (key.startsWith(prefix)) {
                        g_keys.push(key);
                    }
                });
            }
        } while (cursor !== 0);

        redisLogger(`Fetched ${g_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were fetched`,
            keys: g_keys
        };
    } catch (error: any) {
        redisLogger(`Error fetching keys with prefix ${prefix}*`, {
            level: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        return { message: `Error fetching Redis keys with prefix ${prefix}: ${error}`, keys: [] };
    }
}

