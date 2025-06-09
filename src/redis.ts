// Import redis module
import { createClient } from 'redis'

// Import global connection map
import { global_connection_map } from '../server'

// Import logger
import { redisLogger } from './logger'

// Import environment configuration
import { getRedisConfig } from './env-validator'

let client: ReturnType<typeof createClient> | null = null

/**
 * This function is responsible for creating a connection with redis
 * @returns Promise<{ connection: any | null }>
 */
export async function connectRedis(): Promise<{ connection: any | null }> {
    const redisConfig = getRedisConfig()

    if (!redisConfig.host || !redisConfig.port) {
        redisLogger('REDIS_HOST or REDIS_PORT is not set. Skipping Redis connection and running in degraded mode.', { level: 'warn' })
        return { connection: null }
    }

    const url = `redis://${redisConfig.host}:${redisConfig.port}`

    try {
        redisLogger(`Attempting to connect to Redis`, { 
            host: redisConfig.host, 
            port: redisConfig.port, 
            environment: process.env.NODE_ENV 
        })
        client = createClient({ url })

        client.on('error', (err) => {
            redisLogger(`Redis client error: ${err.message}`, { level: 'error' })
        })

        await client.connect()
        redisLogger(`Connected to Redis successfully`)

        // Get Redis server information
        try {
            const info = await client.info()
            const lines = info.split('\r\n')
            
            // Extract relevant information
            const redisVersion = lines.find(line => line.startsWith('redis_version:'))?.split(':')[1]
            const connectedClients = lines.find(line => line.startsWith('connected_clients:'))?.split(':')[1]
            const usedMemory = lines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1]
            const totalKeys = lines.find(line => line.startsWith('db0:keys='))?.split('=')[1]

            if (redisVersion) redisLogger(`Redis \t: Version: ${redisVersion}`)
            if (connectedClients) redisLogger(`Redis \t: Connected Clients: ${connectedClients}`)
            if (usedMemory) redisLogger(`Redis \t: Used Memory: ${usedMemory}`)
            if (totalKeys) redisLogger(`Redis \t: Total Keys: ${totalKeys}`)
        } catch (infoError) {
            redisLogger(`Redis \t: Error fetching Redis information - ${infoError}`, { level: 'error' })
        }

        return { connection: client }
    } catch (error: any) {
        redisLogger(`Unable to connect to Redis: ${error.message}`, { level: 'error' })
        return { connection: null }
    }
}

/**
 * This function is responsible for disconnecting the client with redis
 * @returns Promise<void>
 */
export async function disconnectRedis(): Promise<void> {
    try {
        await client?.disconnect()
        redisLogger(`Redis \t: Disconnected from Redis`)
    } catch (error) {
        redisLogger(`Redis \t: Unable to disconnect from Redis - ${error}`, { level: 'error' })
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

        redisLogger(`Redis \t: Removed ${removed_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were removed`,
            keys: removed_keys
        }
    } catch (error) {
        redisLogger(`Redis \t: Error removing keys with prefix ${prefix}* - ${error}`, { level: 'error' })
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

        redisLogger(`Redis \t: Fetched ${g_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were fetched`,
            keys: g_keys
        }
    } catch (error) {
        redisLogger(`Redis \t: Error fetching keys with prefix ${prefix}* - ${error}`, { level: 'error' })
        throw new Error(`Error fetching Redis keys with prefix ${prefix}: ${error}`)
    }
}

