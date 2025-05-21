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
        // Log Redis connection details
        logger.info(`Redis \t: Attempting to connect to Redis`)
        logger.info(`Redis \t: Host: ${process.env.REDIS_HOST}`)
        logger.info(`Redis \t: Port: ${process.env.REDIS_PORT}`)
        logger.info(`Redis \t: Environment: ${process.env.NODE_ENV}`)

        await client.connect()
        logger.info(`Redis \t: Connected to Redis successfully`)

        // Get Redis server information
        try {
            const info = await client.info()
            const lines = info.split('\r\n')
            
            // Extract relevant information
            const redisVersion = lines.find(line => line.startsWith('redis_version:'))?.split(':')[1]
            const connectedClients = lines.find(line => line.startsWith('connected_clients:'))?.split(':')[1]
            const usedMemory = lines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1]
            const totalKeys = lines.find(line => line.startsWith('db0:keys='))?.split('=')[1]

            if (redisVersion) logger.info(`Redis \t: Version: ${redisVersion}`)
            if (connectedClients) logger.info(`Redis \t: Connected Clients: ${connectedClients}`)
            if (usedMemory) logger.info(`Redis \t: Used Memory: ${usedMemory}`)
            if (totalKeys) logger.info(`Redis \t: Total Keys: ${totalKeys}`)
        } catch (infoError) {
            logger.error(`Redis \t: Error fetching Redis information - ${infoError}`)
        }

        return { connection: client }
    } catch (error) {
        logger.error(`Redis \t: Client error from Redis - ${error}`)
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
        logger.info(`Redis \t: Disconnected from Redis`)
    } catch (error) {
        logger.error(`Redis \t: Unable to disconnect from Redis - ${error}`)
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

        logger.info(`Redis \t: Removed ${removed_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were removed`,
            keys: removed_keys
        }
    } catch (error) {
        logger.error(`Redis \t: Error removing keys with prefix ${prefix}* - ${error}`)
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

        logger.info(`Redis \t: Fetched ${g_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were fetched`,
            keys: g_keys
        }
    } catch (error) {
        logger.error(`Redis \t: Error fetching keys with prefix ${prefix}* - ${error}`)
        throw new Error(`Error fetching Redis keys with prefix ${prefix}: ${error}`)
    }
}

