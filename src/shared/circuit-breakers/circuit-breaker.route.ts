import { Router, Request, Response } from 'express';
import { circuitBreakerManager } from './circuit-breaker-manager';
import { verifyAccessToken, isLoggedIn } from '../../middleware';
import { appLogger } from '../../logger';

export class CircuitBreakerRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        // Health check endpoint for circuit breakers (public)
        this.router.get('/health', async (req: Request, res: Response) => {
            try {
                const healthStatus = await circuitBreakerManager.getHealthStatus();
                
                // Determine overall health
                const isHealthy = healthStatus.manager.initialized && 
                    healthStatus.circuitBreakers.every(cb => cb.state === 'closed');
                
                const statusCode = isHealthy ? 200 : 503;
                
                return res.status(statusCode).json({
                    success: true,
                    status: isHealthy ? 'healthy' : 'degraded',
                    timestamp: new Date().toISOString(),
                    data: healthStatus
                });
            } catch (error) {
                appLogger('Circuit breaker health check failed', {
                    level: 'error',
                    error: error instanceof Error ? error.message : String(error)
                });
                
                return res.status(500).json({
                    success: false,
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    error: 'Health check failed'
                });
            }
        });

        // Metrics endpoint for circuit breakers (requires auth)
        this.router.get('/metrics', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    const metrics = circuitBreakerManager.getMetrics();
                    
                    return res.status(200).json({
                        success: true,
                        timestamp: new Date().toISOString(),
                        data: metrics
                    });
                } catch (error) {
                    appLogger('Circuit breaker metrics retrieval failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        timestamp: new Date().toISOString(),
                        error: 'Metrics retrieval failed'
                    });
                }
            }
        );

        // Performance report endpoint (requires auth)
        this.router.get('/performance', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    const report = circuitBreakerManager.getPerformanceReport();
                    
                    return res.status(200).json({
                        success: true,
                        data: report
                    });
                } catch (error) {
                    appLogger('Circuit breaker performance report failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Performance report generation failed'
                    });
                }
            }
        );

        // Email queue status endpoint (requires auth)
        this.router.get('/email-queue', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    const queueStatus = circuitBreakerManager.emailService.getQueueStatus();
                    
                    return res.status(200).json({
                        success: true,
                        timestamp: new Date().toISOString(),
                        data: queueStatus
                    });
                } catch (error) {
                    appLogger('Email queue status retrieval failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Email queue status retrieval failed'
                    });
                }
            }
        );

        // Force circuit breaker state (admin only - requires additional authorization)
        this.router.post('/force-state', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    const { state } = req.body;
                    
                    if (state !== 'open' && state !== 'close') {
                        return res.status(400).json({
                            success: false,
                            error: 'Invalid state. Must be "open" or "close"'
                        });
                    }

                    // Log the admin action
                    appLogger('Circuit breaker state forced by admin', {
                        level: 'warn',
                        adminUser: (req as any).user?.uuid,
                        adminEmail: (req as any).user?.email,
                        forcedState: state
                    });

                    circuitBreakerManager.forceAllBreakersState(state);
                    
                    return res.status(200).json({
                        success: true,
                        message: `All circuit breakers forced to ${state}`,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    appLogger('Circuit breaker force state failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Force state operation failed'
                    });
                }
            }
        );

        // Reset circuit breaker statistics (admin only)
        this.router.post('/reset-stats', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    // Log the admin action
                    appLogger('Circuit breaker stats reset by admin', {
                        level: 'warn',
                        adminUser: (req as any).user?.uuid,
                        adminEmail: (req as any).user?.email
                    });

                    circuitBreakerManager.resetAllStats();
                    
                    return res.status(200).json({
                        success: true,
                        message: 'All circuit breaker statistics reset',
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    appLogger('Circuit breaker stats reset failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Stats reset operation failed'
                    });
                }
            }
        );

        // Clear email queue (admin only)
        this.router.post('/clear-email-queue', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                try {
                    const queueStatusBefore = circuitBreakerManager.emailService.getQueueStatus();

                    // Log the admin action
                    appLogger('Email queue cleared by admin', {
                        level: 'warn',
                        adminUser: (req as any).user?.uuid,
                        adminEmail: (req as any).user?.email,
                        clearedItems: queueStatusBefore.queueLength
                    });

                    circuitBreakerManager.emailService.clearQueue();
                    
                    return res.status(200).json({
                        success: true,
                        message: `Email queue cleared. ${queueStatusBefore.queueLength} items removed.`,
                        timestamp: new Date().toISOString(),
                        clearedItems: queueStatusBefore.queueLength
                    });
                } catch (error) {
                    appLogger('Email queue clear failed', {
                        level: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Email queue clear operation failed'
                    });
                }
            }
        );

        // Test circuit breaker endpoint (admin only)
        this.router.post('/test/:service', 
            verifyAccessToken,
            isLoggedIn,
            async (req: Request, res: Response) => {
                try {
                    const { service } = req.params;
                    const { operation } = req.body;

                    appLogger('Circuit breaker test initiated by admin', {
                        level: 'info',
                        adminUser: (req as any).user?.uuid,
                        service,
                        operation
                    });

                    let result;
                    
                    switch (service) {
                        case 's3':
                            if (operation === 'health') {
                                // Test S3 connectivity
                                result = await circuitBreakerManager.s3Service.downloadFromS3('test-bucket', 'non-existent-key');
                            }
                            break;
                        case 'email':
                            if (operation === 'test') {
                                // Test email service with dummy data
                                result = await circuitBreakerManager.emailService.sendEmail('test_template', {
                                    email: 'test@example.com',
                                    subject: 'Circuit Breaker Test'
                                });
                            }
                            break;
                        case 'cache':
                            if (operation === 'health') {
                                // Test Redis connectivity
                                result = await circuitBreakerManager.cacheService.getHealthStatus();
                            }
                            break;
                        default:
                            return res.status(400).json({
                                success: false,
                                error: 'Invalid service. Must be "s3", "email", or "cache"'
                            });
                    }
                    
                    return res.status(200).json({
                        success: true,
                        service,
                        operation,
                        result,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    appLogger('Circuit breaker test failed', {
                        level: 'error',
                        service: req.params.service,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    
                    return res.status(500).json({
                        success: false,
                        error: 'Circuit breaker test failed'
                    });
                }
            }
        );
    }
} 