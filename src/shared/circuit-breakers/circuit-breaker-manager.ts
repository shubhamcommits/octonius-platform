import { circuitBreakerService } from './circuit-breaker.service';
import { S3CircuitBreakerService } from './s3-circuit-breaker.service';
import { EmailCircuitBreakerService } from './email-circuit-breaker.service';
import { RedisCacheCircuitBreakerService } from './redis-circuit-breaker.service';
import { appLogger } from '../../logger';

export class CircuitBreakerManager {
    private static instance: CircuitBreakerManager;
    
    // Service instances
    public s3Service: S3CircuitBreakerService;
    public emailService: EmailCircuitBreakerService;
    public cacheService: RedisCacheCircuitBreakerService;
    
    private isInitialized: boolean = false;

    private constructor() {
        // Services will be initialized when manager is initialized
        this.s3Service = null as any;
        this.emailService = null as any;
        this.cacheService = null as any;
    }

    static getInstance(): CircuitBreakerManager {
        if (!CircuitBreakerManager.instance) {
            CircuitBreakerManager.instance = new CircuitBreakerManager();
        }
        return CircuitBreakerManager.instance;
    }

    /**
     * Initialize all circuit breaker services
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            appLogger('Circuit breaker manager already initialized', { level: 'warn' });
            return;
        }

        try {
            appLogger('Initializing circuit breaker manager...', { level: 'info' });

            // Initialize S3 service with circuit breakers
            this.s3Service = new S3CircuitBreakerService();
            appLogger('S3 circuit breaker service initialized', { level: 'info' });

            // Initialize Email service with circuit breakers
            this.emailService = new EmailCircuitBreakerService();
            appLogger('Email circuit breaker service initialized', { level: 'info' });

            // Initialize Cache service with circuit breakers
            this.cacheService = new RedisCacheCircuitBreakerService();
            appLogger('Redis cache circuit breaker service initialized', { level: 'info' });

            this.isInitialized = true;
            
            appLogger('Circuit breaker manager initialization completed', { 
                level: 'info',
                services: ['S3', 'Email', 'RedisCache']
            });

            // Log initial circuit breaker states
            this.logCircuitBreakerStates();

        } catch (error) {
            appLogger('Circuit breaker manager initialization failed', {
                level: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get health status of all circuit breakers
     */
    async getHealthStatus(): Promise<{
        manager: {
            initialized: boolean;
            uptime: string;
        };
        services: {
            s3: any;
            email: any;
            cache: any;
        };
        circuitBreakers: any[];
    }> {
        const startTime = process.uptime();
        
        return {
            manager: {
                initialized: this.isInitialized,
                uptime: `${Math.floor(startTime / 60)}m ${Math.floor(startTime % 60)}s`
            },
            services: {
                s3: this.s3Service ? this.s3Service.getCircuitBreakerStats() : null,
                email: this.emailService ? this.emailService.getCircuitBreakerStats() : null,
                cache: this.cacheService ? this.cacheService.getCircuitBreakerStats() : null
            },
            circuitBreakers: circuitBreakerService.getAllBreakerStats()
        };
    }

    /**
     * Get comprehensive metrics from all circuit breakers
     */
    getMetrics(): {
        totalBreakers: number;
        openBreakers: number;
        halfOpenBreakers: number;
        closedBreakers: number;
        services: {
            s3: any;
            email: any;
            cache: any;
        };
        emailQueue?: any;
    } {
        const allStats = circuitBreakerService.getAllBreakerStats();
        
        const metrics = {
            totalBreakers: allStats.length,
            openBreakers: allStats.filter(stat => stat.state === 'open').length,
            halfOpenBreakers: allStats.filter(stat => stat.state === 'half-open').length,
            closedBreakers: allStats.filter(stat => stat.state === 'closed').length,
            services: {
                s3: this.s3Service ? this.s3Service.getCircuitBreakerStats() : null,
                email: this.emailService ? this.emailService.getCircuitBreakerStats() : null,
                cache: this.cacheService ? this.cacheService.getCircuitBreakerStats() : null
            },
            emailQueue: this.emailService ? this.emailService.getQueueStatus() : undefined
        };

        return metrics;
    }

    /**
     * Log current circuit breaker states
     */
    private logCircuitBreakerStates(): void {
        const stats = circuitBreakerService.getAllBreakerStats();
        
        stats.forEach(stat => {
            appLogger(`Circuit breaker status: ${stat.name}`, {
                level: 'info',
                state: stat.state,
                fires: stat.stats.fires,
                failures: stat.stats.failures,
                successes: stat.stats.successes,
                timeouts: stat.stats.timeouts
            });
        });
    }

    /**
     * Force all circuit breakers to a specific state (for testing)
     */
    forceAllBreakersState(state: 'open' | 'close'): void {
        const allStats = circuitBreakerService.getAllBreakerStats();
        
        allStats.forEach(stat => {
            const breaker = circuitBreakerService.getBreaker(stat.name);
            if (breaker) {
                if (state === 'open') {
                    breaker.open();
                } else {
                    breaker.close();
                }
            }
        });

        appLogger(`All circuit breakers forced to ${state}`, { 
            level: 'warn',
            breakerCount: allStats.length 
        });
    }

    /**
     * Reset all circuit breaker statistics
     */
    resetAllStats(): void {
        const allStats = circuitBreakerService.getAllBreakerStats();
        
        allStats.forEach(stat => {
            const breaker = circuitBreakerService.getBreaker(stat.name);
            if (breaker && typeof (breaker as any).clearStats === 'function') {
                (breaker as any).clearStats();
            }
        });

        appLogger('All circuit breaker statistics reset', { 
            level: 'info',
            breakerCount: allStats.length 
        });
    }

    /**
     * Get detailed report of circuit breaker performance
     */
    getPerformanceReport(): {
        timestamp: string;
        summary: {
            totalBreakers: number;
            healthyBreakers: number;
            faultyBreakers: number;
            totalRequests: number;
            totalFailures: number;
            averageLatency: number;
        };
        breakdown: any[];
    } {
        const allStats = circuitBreakerService.getAllBreakerStats();
        
        const totalRequests = allStats.reduce((sum, stat) => sum + stat.stats.fires, 0);
        const totalFailures = allStats.reduce((sum, stat) => sum + stat.stats.failures, 0);
        const totalLatency = allStats.reduce((sum, stat) => sum + stat.stats.latencyMean, 0);
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalBreakers: allStats.length,
                healthyBreakers: allStats.filter(stat => stat.state === 'closed').length,
                faultyBreakers: allStats.filter(stat => stat.state === 'open').length,
                totalRequests,
                totalFailures,
                averageLatency: allStats.length > 0 ? totalLatency / allStats.length : 0
            },
            breakdown: allStats.map(stat => ({
                name: stat.name,
                state: stat.state,
                successRate: stat.stats.fires > 0 ? 
                    ((stat.stats.successes / stat.stats.fires) * 100).toFixed(2) + '%' : 'N/A',
                averageLatency: stat.stats.latencyMean.toFixed(2) + 'ms',
                totalRequests: stat.stats.fires,
                failures: stat.stats.failures,
                timeouts: stat.stats.timeouts,
                fallbacks: stat.stats.fallbacks
            }))
        };
    }

    /**
     * Shutdown all circuit breakers gracefully
     */
    async shutdown(): Promise<void> {
        appLogger('Shutting down circuit breaker manager...', { level: 'info' });
        
        try {
            // Clear email queue processing
            if (this.emailService) {
                this.emailService.clearQueue();
            }

            // Shutdown all circuit breakers
            circuitBreakerService.shutdown();
            
            this.isInitialized = false;
            
            appLogger('Circuit breaker manager shutdown completed', { level: 'info' });
        } catch (error) {
            appLogger('Error during circuit breaker manager shutdown', {
                level: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Check if manager is properly initialized
     */
    isReady(): boolean {
        return this.isInitialized && 
               !!this.s3Service && 
               !!this.emailService && 
               !!this.cacheService;
    }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance(); 