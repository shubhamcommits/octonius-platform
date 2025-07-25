import { isRedisAvailable } from '../redis'
import { redisLogger } from '../logger'
import { global_connection_map } from '../../server'

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
    USER_PROFILE: 300,        // 5 minutes - User profile data
    USER_WORKPLACES: 600,     // 10 minutes - User workplace list  
    WORKPLACE_DATA: 900,      // 15 minutes - Workplace details
    GROUP_LIST: 300,          // 5 minutes - Group listings
    GROUP_DETAILS: 600,       // 10 minutes - Individual group data
    FILE_LIST: 180,           // 3 minutes - File listings
    ACTIVITY_FEED: 60,        // 1 minute - Activity feeds (more dynamic)
    TASK_BOARD: 120,          // 2 minutes - Task board data
    SEARCH_RESULTS: 300,      // 5 minutes - Search results
    MEMBERSHIP_DATA: 1800,    // 30 minutes - Membership data (changes less frequently)
    PERMISSIONS: 1800,        // 30 minutes - Permission checks
} as const

/**
 * Cache key prefixes for organized data structure
 */
export const CACHE_KEYS = {
    USER: 'user',
    USER_WORKPLACES: 'user_workplaces',
    WORKPLACE: 'workplace',
    WORKPLACE_MEMBERS: 'workplace_members',
    GROUP: 'group',
    GROUP_LIST: 'group_list',
    GROUP_MEMBERS: 'group_members',
    FILE_LIST: 'file_list',
    FILE_MYSPACE: 'file_myspace',
    ACTIVITY_FEED: 'activity_feed',
    ACTIVITY_POST: 'activity_post',
    TASK_BOARD: 'task_board',
    TASK: 'task',
    SEARCH: 'search',
    PERMISSIONS: 'permissions',
} as const

/**
 * Comprehensive cache service for Redis operations
 */
export class CacheService {
    /**
     * Get Redis client from global connection map
     */
    private static getRedisClient(): any {
        return global_connection_map.get('redis')
    }

    /**
     * Generic get method with automatic JSON parsing
     */
    static async get<T>(key: string): Promise<T | null> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for get operation', { key })
            return null
        }

        try {
            const redis = this.getRedisClient()
            if (!redis) return null
            
            const value = await redis.get(key)
            if (!value) return null
            
            return JSON.parse(value)
        } catch (error: any) {
            redisLogger('Error getting cached data', {
                level: 'error',
                key,
                error: error.message
            })
            return null
        }
    }

    /**
     * Generic set method with automatic JSON stringification
     */
    static async set(key: string, value: any, ttl: number): Promise<boolean> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for set operation', { key })
            return false
        }

        try {
            const redis = this.getRedisClient()
            if (!redis) return false
            
            await redis.setEx(key, ttl, JSON.stringify(value))
            redisLogger('Data cached successfully', { key, ttl })
            return true
        } catch (error: any) {
            redisLogger('Error caching data', {
                level: 'error',
                key,
                ttl,
                error: error.message
            })
            return false
        }
    }

    /**
     * Delete single cache key
     */
    static async delete(key: string): Promise<boolean> {
        if (!isRedisAvailable()) return false

        try {
            const redis = this.getRedisClient()
            if (!redis) return false
            
            await redis.del(key)
            redisLogger('Cache key deleted', { key })
            return true
        } catch (error: any) {
            redisLogger('Error deleting cache key', {
                level: 'error',
                key,
                error: error.message
            })
            return false
        }
    }

    /**
     * Delete multiple cache keys by pattern
     */
    static async deletePattern(pattern: string): Promise<number> {
        if (!isRedisAvailable()) return 0

        try {
            const redis = this.getRedisClient()
            if (!redis) return 0
            
            const keys = await redis.keys(pattern)
            if (keys.length === 0) return 0

            await redis.del(keys)
            redisLogger('Cache keys deleted by pattern', { pattern, count: keys.length })
            return keys.length
        } catch (error: any) {
            redisLogger('Error deleting cache keys by pattern', {
                level: 'error',
                pattern,
                error: error.message
            })
            return 0
        }
    }

    /**
     * Check if key exists
     */
    static async exists(key: string): Promise<boolean> {
        if (!isRedisAvailable()) return false

        try {
            const redis = this.getRedisClient()
            if (!redis) return false
            
            const exists = await redis.exists(key)
            return exists === 1
        } catch (error: any) {
            redisLogger('Error checking key existence', {
                level: 'error',
                key,
                error: error.message
            })
            return false
        }
    }

    /**
     * Get remaining TTL for a key
     */
    static async ttl(key: string): Promise<number> {
        if (!isRedisAvailable()) return -1

        try {
            const redis = this.getRedisClient()
            if (!redis) return -1
            
            return await redis.ttl(key)
        } catch (error: any) {
            redisLogger('Error getting TTL', {
                level: 'error',
                key,
                error: error.message
            })
            return -1
        }
    }

    // === USER CACHING ===

    static async getUserProfile(userId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.USER}:${userId}`)
    }

    static async setUserProfile(userId: string, userData: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.USER}:${userId}`, userData, CACHE_TTL.USER_PROFILE)
    }

    static async invalidateUserProfile(userId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.USER}:${userId}`)
    }

    static async getUserWorkplaces(userId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.USER_WORKPLACES}:${userId}`)
    }

    static async setUserWorkplaces(userId: string, workplaces: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.USER_WORKPLACES}:${userId}`, workplaces, CACHE_TTL.USER_WORKPLACES)
    }

    static async invalidateUserWorkplaces(userId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.USER_WORKPLACES}:${userId}`)
    }

    // === WORKPLACE CACHING ===

    static async getWorkplace(workplaceId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.WORKPLACE}:${workplaceId}`)
    }

    static async setWorkplace(workplaceId: string, workplaceData: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.WORKPLACE}:${workplaceId}`, workplaceData, CACHE_TTL.WORKPLACE_DATA)
    }

    static async invalidateWorkplace(workplaceId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.WORKPLACE}:${workplaceId}`)
    }

    static async getWorkplaceMembers(workplaceId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.WORKPLACE_MEMBERS}:${workplaceId}`)
    }

    static async setWorkplaceMembers(workplaceId: string, members: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.WORKPLACE_MEMBERS}:${workplaceId}`, members, CACHE_TTL.MEMBERSHIP_DATA)
    }

    static async invalidateWorkplaceMembers(workplaceId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.WORKPLACE_MEMBERS}:${workplaceId}`)
    }

    // === GROUP CACHING ===

    static async getGroupList(workplaceId: string, userId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.GROUP_LIST}:${workplaceId}:${userId}`)
    }

    static async setGroupList(workplaceId: string, userId: string, groups: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.GROUP_LIST}:${workplaceId}:${userId}`, groups, CACHE_TTL.GROUP_LIST)
    }

    static async invalidateGroupList(workplaceId: string, userId?: string): Promise<number> {
        if (userId) {
            await this.delete(`${CACHE_KEYS.GROUP_LIST}:${workplaceId}:${userId}`)
            return 1
        }
        return this.deletePattern(`${CACHE_KEYS.GROUP_LIST}:${workplaceId}:*`)
    }

    static async getGroup(groupId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.GROUP}:${groupId}`)
    }

    static async setGroup(groupId: string, groupData: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.GROUP}:${groupId}`, groupData, CACHE_TTL.GROUP_DETAILS)
    }

    static async invalidateGroup(groupId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.GROUP}:${groupId}`)
    }

    static async getGroupMembers(groupId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.GROUP_MEMBERS}:${groupId}`)
    }

    static async setGroupMembers(groupId: string, members: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.GROUP_MEMBERS}:${groupId}`, members, CACHE_TTL.MEMBERSHIP_DATA)
    }

    static async invalidateGroupMembers(groupId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.GROUP_MEMBERS}:${groupId}`)
    }

    // === FILE CACHING ===

    static async getFileList(userId: string, workplaceId: string, groupId?: string, sourceContext?: string): Promise<any | null> {
        const key = groupId 
            ? `${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}:${groupId}${sourceContext ? `:${sourceContext}` : ''}`
            : `${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}${sourceContext ? `:${sourceContext}` : ''}`
        return this.get(key)
    }

    static async setFileList(userId: string, workplaceId: string, files: any, groupId?: string, sourceContext?: string): Promise<boolean> {
        const key = groupId 
            ? `${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}:${groupId}${sourceContext ? `:${sourceContext}` : ''}`
            : `${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}${sourceContext ? `:${sourceContext}` : ''}`
        return this.set(key, files, CACHE_TTL.FILE_LIST)
    }

    static async invalidateFileList(userId: string, workplaceId?: string, groupId?: string): Promise<number> {
        if (groupId && workplaceId) {
            await this.delete(`${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}:${groupId}`)
            return 1
        }
        if (workplaceId) {
            return this.deletePattern(`${CACHE_KEYS.FILE_LIST}:${userId}:${workplaceId}*`)
        }
        return this.deletePattern(`${CACHE_KEYS.FILE_LIST}:${userId}:*`)
    }

    static async getMySpaceFiles(userId: string, workplaceId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.FILE_MYSPACE}:${userId}:${workplaceId}`)
    }

    static async setMySpaceFiles(userId: string, workplaceId: string, files: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.FILE_MYSPACE}:${userId}:${workplaceId}`, files, CACHE_TTL.FILE_LIST)
    }

    static async invalidateMySpaceFiles(userId: string, workplaceId?: string): Promise<number> {
        if (workplaceId) {
            await this.delete(`${CACHE_KEYS.FILE_MYSPACE}:${userId}:${workplaceId}`)
            return 1
        }
        return this.deletePattern(`${CACHE_KEYS.FILE_MYSPACE}:${userId}:*`)
    }

    // === ACTIVITY CACHING ===

    static async getActivityFeed(groupId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.ACTIVITY_FEED}:${groupId}`)
    }

    static async setActivityFeed(groupId: string, posts: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.ACTIVITY_FEED}:${groupId}`, posts, CACHE_TTL.ACTIVITY_FEED)
    }

    static async invalidateActivityFeed(groupId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.ACTIVITY_FEED}:${groupId}`)
    }

    static async getActivityPost(postId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.ACTIVITY_POST}:${postId}`)
    }

    static async setActivityPost(postId: string, post: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.ACTIVITY_POST}:${postId}`, post, CACHE_TTL.ACTIVITY_FEED)
    }

    static async invalidateActivityPost(postId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.ACTIVITY_POST}:${postId}`)
    }

    // === TASK CACHING ===

    static async getTaskBoard(groupId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.TASK_BOARD}:${groupId}`)
    }

    static async setTaskBoard(groupId: string, board: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.TASK_BOARD}:${groupId}`, board, CACHE_TTL.TASK_BOARD)
    }

    static async invalidateTaskBoard(groupId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.TASK_BOARD}:${groupId}`)
    }

    static async getTask(taskId: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.TASK}:${taskId}`)
    }

    static async setTask(taskId: string, task: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.TASK}:${taskId}`, task, CACHE_TTL.TASK_BOARD)
    }

    static async invalidateTask(taskId: string): Promise<boolean> {
        return this.delete(`${CACHE_KEYS.TASK}:${taskId}`)
    }

    // === SEARCH CACHING ===

    static async getSearchResults(query: string, type: string, workplaceId: string): Promise<any | null> {
        const key = `${CACHE_KEYS.SEARCH}:${type}:${workplaceId}:${Buffer.from(query).toString('base64')}`
        return this.get(key)
    }

    static async setSearchResults(query: string, type: string, workplaceId: string, results: any): Promise<boolean> {
        const key = `${CACHE_KEYS.SEARCH}:${type}:${workplaceId}:${Buffer.from(query).toString('base64')}`
        return this.set(key, results, CACHE_TTL.SEARCH_RESULTS)
    }

    static async invalidateSearchResults(workplaceId: string, type?: string): Promise<number> {
        if (type) {
            return this.deletePattern(`${CACHE_KEYS.SEARCH}:${type}:${workplaceId}:*`)
        }
        return this.deletePattern(`${CACHE_KEYS.SEARCH}:*:${workplaceId}:*`)
    }

    // === PERMISSION CACHING ===

    static async getPermissions(userId: string, resourceId: string, resourceType: string): Promise<any | null> {
        return this.get(`${CACHE_KEYS.PERMISSIONS}:${userId}:${resourceType}:${resourceId}`)
    }

    static async setPermissions(userId: string, resourceId: string, resourceType: string, permissions: any): Promise<boolean> {
        return this.set(`${CACHE_KEYS.PERMISSIONS}:${userId}:${resourceType}:${resourceId}`, permissions, CACHE_TTL.PERMISSIONS)
    }

    static async invalidatePermissions(userId: string, resourceId?: string, resourceType?: string): Promise<number> {
        if (resourceId && resourceType) {
            await this.delete(`${CACHE_KEYS.PERMISSIONS}:${userId}:${resourceType}:${resourceId}`)
            return 1
        }
        if (resourceType) {
            return this.deletePattern(`${CACHE_KEYS.PERMISSIONS}:${userId}:${resourceType}:*`)
        }
        return this.deletePattern(`${CACHE_KEYS.PERMISSIONS}:${userId}:*`)
    }

    // === BULK INVALIDATION METHODS ===

    static async invalidateUserData(userId: string): Promise<void> {
        await Promise.all([
            this.invalidateUserProfile(userId),
            this.invalidateUserWorkplaces(userId),
            this.invalidateFileList(userId),
            this.invalidateMySpaceFiles(userId),
            this.invalidatePermissions(userId)
        ])
        redisLogger('User data cache invalidated', { userId })
    }

    static async invalidateWorkplaceData(workplaceId: string): Promise<void> {
        await Promise.all([
            this.invalidateWorkplace(workplaceId),
            this.invalidateWorkplaceMembers(workplaceId),
            this.invalidateGroupList(workplaceId),
            this.invalidateSearchResults(workplaceId)
        ])
        redisLogger('Workplace data cache invalidated', { workplaceId })
    }

    static async invalidateGroupData(groupId: string, workplaceId?: string): Promise<void> {
        await Promise.all([
            this.invalidateGroup(groupId),
            this.invalidateGroupMembers(groupId),
            this.invalidateActivityFeed(groupId),
            this.invalidateTaskBoard(groupId),
            ...(workplaceId ? [this.invalidateGroupList(workplaceId)] : [])
        ])
        redisLogger('Group data cache invalidated', { groupId, workplaceId })
    }
} 