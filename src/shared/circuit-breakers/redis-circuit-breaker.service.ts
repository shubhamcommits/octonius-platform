import { circuitBreakerService, CIRCUIT_BREAKER_CONFIGS, type CircuitBreakerStats } from './circuit-breaker.service';
import { isRedisAvailable } from '../../redis';
import { redisLogger } from '../../logger';
import { global_connection_map } from '../../../server';

export class RedisCacheCircuitBreakerService {
    private getBreaker: any;
    private setBreaker: any;
    private deleteBreaker: any;
    private existsBreaker: any;

    constructor() {
        this.initializeCircuitBreakers();
    }

    private initializeCircuitBreakers() {
        // Redis GET operations
        this.getBreaker = circuitBreakerService.createBreaker(
            this.executeGet.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.REDIS_CACHE,
                name: 'REDIS_GET',
                fallback: () => {
                    redisLogger('Redis GET fallback - returning null', { level: 'warn' });
                    return null;
                }
            }
        );

        // Redis SET operations
        this.setBreaker = circuitBreakerService.createBreaker(
            this.executeSet.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.REDIS_CACHE,
                name: 'REDIS_SET',
                fallback: () => {
                    redisLogger('Redis SET fallback - operation skipped', { level: 'warn' });
                    return false;
                }
            }
        );

        // Redis DELETE operations
        this.deleteBreaker = circuitBreakerService.createBreaker(
            this.executeDelete.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.REDIS_CACHE,
                name: 'REDIS_DELETE',
                fallback: () => {
                    redisLogger('Redis DELETE fallback - operation skipped', { level: 'warn' });
                    return false;
                }
            }
        );

        // Redis EXISTS operations
        this.existsBreaker = circuitBreakerService.createBreaker(
            this.executeExists.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.REDIS_CACHE,
                name: 'REDIS_EXISTS',
                fallback: () => {
                    redisLogger('Redis EXISTS fallback - returning false', { level: 'warn' });
                    return false;
                }
            }
        );
    }

    /**
     * Get value from Redis with circuit breaker protection
     */
    async get<T>(key: string): Promise<T | null> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for get operation', { key });
            return null;
        }

        try {
            const result = await this.getBreaker.fire(key);
            if (result === null) {
                return null;
            }
            return JSON.parse(result);
        } catch (error) {
            redisLogger('Redis get operation failed through circuit breaker', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    /**
     * Set value in Redis with circuit breaker protection
     */
    async set(key: string, value: any, ttl?: number): Promise<boolean> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for set operation', { key });
            return false;
        }

        try {
            return await this.setBreaker.fire(key, JSON.stringify(value), ttl);
        } catch (error) {
            redisLogger('Redis set operation failed through circuit breaker', {
                level: 'error',
                key,
                ttl,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }

    /**
     * Set value with expiration in Redis
     */
    async setEx(key: string, ttl: number, value: any): Promise<boolean> {
        return this.set(key, value, ttl);
    }

    /**
     * Delete key from Redis with circuit breaker protection
     */
    async delete(key: string): Promise<boolean> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for delete operation', { key });
            return false;
        }

        try {
            return await this.deleteBreaker.fire(key);
        } catch (error) {
            redisLogger('Redis delete operation failed through circuit breaker', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }

    /**
     * Check if key exists in Redis with circuit breaker protection
     */
    async exists(key: string): Promise<boolean> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for exists operation', { key });
            return false;
        }

        try {
            return await this.existsBreaker.fire(key);
        } catch (error) {
            redisLogger('Redis exists operation failed through circuit breaker', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }

    /**
     * Delete multiple keys with pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for delete pattern operation', { pattern });
            return 0;
        }

        try {
            const redis = this.getRedisClient();
            if (!redis) return 0;

            const keys = await redis.keys(pattern);
            if (keys.length === 0) return 0;

            const deletedCount = await redis.del(keys);
            redisLogger('Pattern deletion completed', { pattern, deletedCount });
            return deletedCount;
        } catch (error) {
            redisLogger('Redis pattern delete failed', {
                level: 'error',
                pattern,
                error: error instanceof Error ? error.message : String(error)
            });
            return 0;
        }
    }

    /**
     * Get TTL for a key
     */
    async ttl(key: string): Promise<number> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for TTL operation', { key });
            return -1;
        }

        try {
            const redis = this.getRedisClient();
            if (!redis) return -1;

            return await redis.ttl(key);
        } catch (error) {
            redisLogger('Redis TTL check failed', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return -1;
        }
    }

    /**
     * Increment a counter with circuit breaker protection
     */
    async incr(key: string): Promise<number | null> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for incr operation', { key });
            return null;
        }

        try {
            const redis = this.getRedisClient();
            if (!redis) return null;

            return await redis.incr(key);
        } catch (error) {
            redisLogger('Redis incr operation failed', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    /**
     * Decrement a counter with circuit breaker protection
     */
    async decr(key: string): Promise<number | null> {
        if (!isRedisAvailable()) {
            redisLogger('Redis unavailable for decr operation', { key });
            return null;
        }

        try {
            const redis = this.getRedisClient();
            if (!redis) return null;

            return await redis.decr(key);
        } catch (error) {
            redisLogger('Redis decr operation failed', {
                level: 'error',
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    /**
     * Get multiple keys at once
     */
    async mget(keys: string[]): Promise<(string | null)[]> {
        if (!isRedisAvailable() || keys.length === 0) {
            return new Array(keys.length).fill(null);
        }

        try {
            const redis = this.getRedisClient();
            if (!redis) return new Array(keys.length).fill(null);

            return await redis.mGet(keys);
        } catch (error) {
            redisLogger('Redis mget operation failed', {
                level: 'error',
                keys: keys.length,
                error: error instanceof Error ? error.message : String(error)
            });
            return new Array(keys.length).fill(null);
        }
    }

    /**
     * Get Redis connection health status
     */
    async getHealthStatus(): Promise<{
        available: boolean;
        latency: number;
        error?: string;
    }> {
        const start = Date.now();
        
        if (!isRedisAvailable()) {
            return {
                available: false,
                latency: -1,
                error: 'Redis connection not available'
            };
        }

        try {
            await this.get('health_check_key');
            return {
                available: true,
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                available: false,
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    // Private methods for actual Redis operations
    private getRedisClient(): any {
        return global_connection_map.get('redis');
    }

    private async executeGet(key: string): Promise<string | null> {
        const redis = this.getRedisClient();
        if (!redis) throw new Error('Redis client not available');
        
        const value = await redis.get(key);
        redisLogger('Redis get successful', { key, hasValue: !!value });
        return value;
    }

    private async executeSet(key: string, value: string, ttl?: number): Promise<boolean> {
        const redis = this.getRedisClient();
        if (!redis) throw new Error('Redis client not available');
        
        if (ttl) {
            await redis.setEx(key, ttl, value);
        } else {
            await redis.set(key, value);
        }
        
        redisLogger('Redis set successful', { key, ttl });
        return true;
    }

    private async executeDelete(key: string): Promise<boolean> {
        const redis = this.getRedisClient();
        if (!redis) throw new Error('Redis client not available');
        
        const result = await redis.del(key);
        redisLogger('Redis delete successful', { key, deleted: result > 0 });
        return result > 0;
    }

    private async executeExists(key: string): Promise<boolean> {
        const redis = this.getRedisClient();
        if (!redis) throw new Error('Redis client not available');
        
        const exists = await redis.exists(key);
        redisLogger('Redis exists check successful', { key, exists: exists === 1 });
        return exists === 1;
    }

    /**
     * Get circuit breaker statistics for all Redis operations
     */
    getCircuitBreakerStats(): {
        get: CircuitBreakerStats | null;
        set: CircuitBreakerStats | null;
        delete: CircuitBreakerStats | null;
        exists: CircuitBreakerStats | null;
    } {
        return {
            get: circuitBreakerService.getBreakerStats('REDIS_GET'),
            set: circuitBreakerService.getBreakerStats('REDIS_SET'),
            delete: circuitBreakerService.getBreakerStats('REDIS_DELETE'),
            exists: circuitBreakerService.getBreakerStats('REDIS_EXISTS')
        };
    }

    /**
     * Force all Redis circuit breakers to open (for testing)
     */
    forceAllBreakersOpen(): void {
        ['REDIS_GET', 'REDIS_SET', 'REDIS_DELETE', 'REDIS_EXISTS'].forEach(name => {
            const breaker = circuitBreakerService.getBreaker(name);
            if (breaker) {
                breaker.open();
                redisLogger(`${name} circuit breaker forced open`, { level: 'warn' });
            }
        });
    }

    /**
     * Force all Redis circuit breakers to close (for testing)
     */
    forceAllBreakersClose(): void {
        ['REDIS_GET', 'REDIS_SET', 'REDIS_DELETE', 'REDIS_EXISTS'].forEach(name => {
            const breaker = circuitBreakerService.getBreaker(name);
            if (breaker) {
                breaker.close();
                redisLogger(`${name} circuit breaker forced closed`, { level: 'info' });
            }
        });
    }
} 