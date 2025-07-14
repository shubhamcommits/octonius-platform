import CircuitBreaker from 'opossum';
import { appLogger } from '../../logger';

interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  requestVolumeThreshold: number;
  rollingCountTimeout: number;
  name: string;
  fallback?: (...args: any[]) => any;
}

export interface CircuitBreakerStats {
  name: string;
  state: 'open' | 'closed' | 'half-open';
  stats: {
    fires: number;
    cacheHits: number;
    cacheMisses: number;
    timeouts: number;
    failures: number;
    rejects: number;
    successes: number;
    fallbacks: number;
    semaphoreRejections: number;
    percentiles: Record<string, number>;
    latencyTimes: number[];
    latencyMean: number;
  };
}

export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  createBreaker<T>(
    asyncFunction: (...args: any[]) => Promise<T>,
    config: CircuitBreakerConfig
  ): CircuitBreaker {
    if (this.breakers.has(config.name)) {
      return this.breakers.get(config.name)!;
    }

    const options: any = {
      timeout: config.timeout,
      errorThresholdPercentage: config.errorThresholdPercentage,
      resetTimeout: config.resetTimeout,
      volumeThreshold: config.requestVolumeThreshold,
      rollingCountTimeout: config.rollingCountTimeout,
      name: config.name,
      cache: true,
      healthCheckInterval: 30000
    };

    if (config.fallback) {
      options.fallback = config.fallback;
    }

    const breaker = new CircuitBreaker(asyncFunction, options);

    // Add comprehensive event listeners
    breaker.on('open', () => {
      appLogger(`Circuit breaker OPENED for ${config.name}`, { 
        level: 'error',
        service: config.name,
        circuitBreakerState: 'open'
      });
    });

    breaker.on('halfOpen', () => {
      appLogger(`Circuit breaker HALF-OPEN for ${config.name}`, {
        level: 'warn',
        service: config.name,
        circuitBreakerState: 'half-open'
      });
    });

    breaker.on('close', () => {
      appLogger(`Circuit breaker CLOSED for ${config.name}`, {
        level: 'info',
        service: config.name,
        circuitBreakerState: 'closed'
      });
    });

    breaker.on('timeout', () => {
      appLogger(`Circuit breaker TIMEOUT for ${config.name}`, {
        level: 'warn',
        service: config.name,
        event: 'timeout'
      });
    });

    breaker.on('reject', () => {
      appLogger(`Circuit breaker REJECT for ${config.name}`, {
        level: 'warn',
        service: config.name,
        event: 'reject'
      });
    });

    breaker.on('failure', (error: Error) => {
      appLogger(`Circuit breaker FAILURE for ${config.name}`, {
        level: 'error',
        service: config.name,
        event: 'failure',
        error: error.message
      });
    });

    breaker.on('fallback', (data: any) => {
      appLogger(`Circuit breaker FALLBACK for ${config.name}`, {
        level: 'warn',
        service: config.name,
        event: 'fallback',
        fallbackData: data
      });
    });

    breaker.on('success', () => {
      appLogger(`Circuit breaker SUCCESS for ${config.name}`, {
        level: 'debug',
        service: config.name,
        event: 'success'
      });
    });

    this.breakers.set(config.name, breaker);
    return breaker;
  }

  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getBreakerStats(name: string): CircuitBreakerStats | null {
    const breaker = this.breakers.get(name);
    if (!breaker) return null;

    return {
      name,
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: {
        fires: breaker.stats.fires,
        cacheHits: breaker.stats.cacheHits,
        cacheMisses: breaker.stats.cacheMisses,
        timeouts: breaker.stats.timeouts,
        failures: breaker.stats.failures,
        rejects: breaker.stats.rejects,
        successes: breaker.stats.successes,
        fallbacks: breaker.stats.fallbacks,
        semaphoreRejections: breaker.stats.semaphoreRejections,
        percentiles: breaker.stats.percentiles,
        latencyTimes: breaker.stats.latencyTimes,
        latencyMean: breaker.stats.latencyMean
      }
    };
  }

  getAllBreakerStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.keys()).map(name => this.getBreakerStats(name)!).filter(Boolean);
  }

  async executeWithCircuitBreaker<T>(
    breakerName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const breaker = this.breakers.get(breakerName);
    if (!breaker) {
      throw new Error(`Circuit breaker '${breakerName}' not found`);
    }

    try {
      const result = await breaker.fire(operation);
      return result as T;
    } catch (error) {
      if (fallback) {
        appLogger(`Using fallback for ${breakerName}`, {
          level: 'warn',
          service: breakerName,
          error: error instanceof Error ? error.message : String(error)
        });
        return await fallback();
      }
      throw error;
    }
  }

  shutdown(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      appLogger(`Circuit breaker ${name} shutdown`, {
        level: 'info',
        service: name
      });
    });
    this.breakers.clear();
  }
}

// Export singleton instance
export const circuitBreakerService = CircuitBreakerService.getInstance();

// Predefined circuit breaker configurations
export const CIRCUIT_BREAKER_CONFIGS: Record<string, Omit<CircuitBreakerConfig, 'name'>> = {
  AWS_S3: {
    timeout: 15000, // 15 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    requestVolumeThreshold: 5,
    rollingCountTimeout: 10000, // 10 seconds
    fallback: () => {
      throw new Error('S3 service temporarily unavailable');
    }
  },
  EMAIL_SERVICE: {
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 60,
    resetTimeout: 60000, // 1 minute
    requestVolumeThreshold: 3,
    rollingCountTimeout: 15000, // 15 seconds
    fallback: () => {
      appLogger('Email service fallback - queuing for retry', { level: 'warn' });
      return { success: false, message: 'Email queued for retry' };
    }
  },
  REDIS_CACHE: {
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 70,
    resetTimeout: 15000, // 15 seconds
    requestVolumeThreshold: 10,
    rollingCountTimeout: 5000, // 5 seconds
    fallback: () => null // Return null for cache misses
  },
  DATABASE_WRITE: {
    timeout: 20000, // 20 seconds
    errorThresholdPercentage: 30, // Lower threshold for critical operations
    resetTimeout: 45000, // 45 seconds
    requestVolumeThreshold: 3,
    rollingCountTimeout: 10000, // 10 seconds
  },
  DATABASE_READ: {
    timeout: 15000, // 15 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    requestVolumeThreshold: 5,
    rollingCountTimeout: 10000, // 10 seconds
  }
}; 