// Import redis module
import { createClient } from 'redis'

// Import global connection map
import { global_connection_map } from '../server'

// Import logger
import { redisLogger } from './logger'

// Import environment configuration
import { getRedisConfig, getEnv } from './config'

let client: ReturnType<typeof createClient> | null = null

/**
 * Connects to Redis
 */
export async function connectRedis() {
    try {
        const config = getRedisConfig()
        const url = `redis://${config.host}:${config.port}`

        redisLogger('Connecting to Redis', {
            host: config.host,
            port: config.port
        })

        client = createClient({ url })

        client.on('error', (err) => {
            redisLogger('Client Error', {
                level: 'error',
                error: err.message
            })
        })

        await client.connect()

        redisLogger('Connected', {
            host: config.host,
            port: config.port
        })

        return client
    } catch (error) {
        redisLogger('Connection Error', {
            level: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
    }
}

/**
 * Disconnects from Redis
 */
export async function disconnectRedis() {
    if (client) {
        await client.quit()
        client = null
        redisLogger('Disconnected')
    }
}

/**
 * Deletes Redis keys by prefix
 * @param prefix - The prefix to match keys
 */
export async function deleteRedisKeysByPrefix(prefix: string) {
    if (!client) {
        throw new Error('Redis client not initialized')
    }

    try {
        const keys = await client.keys(`${prefix}*`)
        if (keys.length > 0) {
            await client.del(keys)
            redisLogger(`Deleted ${keys.length} keys with prefix: ${prefix}`)
        }
    } catch (error) {
        redisLogger('Error deleting keys', {
            level: 'error',
            prefix,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
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

        redisLogger(`Fetched ${g_keys.length} keys with prefix ${prefix}*`)
        return {
            message: `Keys with prefix ${prefix}* were fetched`,
            keys: g_keys
        }
    } catch (error) {
        redisLogger(`Error fetching keys with prefix ${prefix}*`, { 
            level: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw new Error(`Error fetching Redis keys with prefix ${prefix}: ${error}`)
    }
}

