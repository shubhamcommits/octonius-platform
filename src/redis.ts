// Import redis module
import { createClient } from 'redis'

// Import global connection map
import { global_connection_map } from '../server'

// Import logger
import logger from './logger'

// Create client
const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
})

/**
 * This function is responsible for creating a connection with redis
 * @returns Promise<{ connection: any }>
 */
export async function connectRedis(): Promise<{ connection: any }> {
    try {
        await client.connect()
        logger.info('Connected to redis successfully')
        return { connection: client }
    } catch (error) {
        logger.error(`Client error from redis: ${error}`)
        throw new Error(`Redis connection error: ${error}`)
    }
}

/**
 * This function is responsible for disconnecting the client with redis
 * @returns Promise<void>
 */
export async function disconnectRedis(): Promise<void> {
    try {
        await client.disconnect()
        logger.info('Disconnected from redis')
    } catch (error) {
        logger.error(`Unable to disconnect from redis: ${error}`)
        throw new Error(`Redis disconnection error: ${error}`)
    }
}

/**
 * Delete Redis keys starting with a specific prefix
 * @param prefix - The prefix to search for
 * @returns Promise<{ message: string, keys: string[] }>
 */
export async function deleteRedisKeysByPrefix(prefix: string): Promise<{ message: string, keys: string[] }> {
    try {
        const redis: any = global_connection_map.get('redis')
        let cursor = '0'
        const removed_keys: string[] = []

        do {
            const result = await redis.scan(cursor, 'MATCH', '*', 'COUNT', 100)
            cursor = result.cursor || 0
            const keys = result.keys || []

            if (keys.length > 0) {
                for (const key of keys) {
                    if (key.startsWith(prefix)) {
                        removed_keys.push(key)
                        await redis.del(key)
                    }
                }
            }
        } while (cursor != '0')

        logger.info(`Removed keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were removed`,
            keys: removed_keys
        }
    } catch (error) {
        logger.error(`Error removing keys with prefix ${prefix}*: ${error}`)
        throw new Error(`Error removing Redis keys with prefix ${prefix}: ${error}`)
    }
}

/**
 * Fetch redis keys by prefix
 * @param prefix - The prefix to search for
 * @returns Promise<{ message: string, keys: string[] }>
 */
export async function fetchRedisKeysByPrefix(prefix: string): Promise<{ message: string, keys: string[] }> {
    try {
        const redis: any = global_connection_map.get('redis')
        let cursor = '0'
        const g_keys: string[] = []

        do {
            const result = await redis.scan(cursor, 'MATCH', '*', 'COUNT', 100)
            cursor = result.cursor || 0
            const keys = result.keys || []

            if (keys.length > 0) {
                keys.forEach((key: string) => {
                    if (key.startsWith(prefix)) {
                        g_keys.push(key)
                    }
                })
            }
        } while (cursor != '0')

        logger.info(`Keys with prefix ${prefix}* were fetched`)
        return {
            message: `Keys with prefix ${prefix}* were fetched`,
            keys: g_keys
        }
    } catch (error) {
        logger.error(`Error fetching keys with prefix ${prefix}*: ${error}`)
        throw new Error(`Error fetching Redis keys with prefix ${prefix}: ${error}`)
    }
}

