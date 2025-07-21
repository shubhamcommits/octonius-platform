// Import environment configuration
import { getEnv } from './config'

// Import logger
import { appLogger } from './logger'

// Get environment variables
const { APP_NAME, NODE_ENV } = getEnv()

// Express Module
import express, { NextFunction, Request, Response } from 'express'

// Cors Module
import cors from 'cors'

// Morgan Module
import morgan from 'morgan'

// Compression Module
import compression from 'compression'

// Import Sequelize
import { db } from './sequelize'

// Import User Route
import { UserRoute } from './users'

// Import Notification Route
import { NotificationRoute } from './notifications'

// Import Auth Route
import { AuthRoute } from './auths'

// Import Workplace Route
import { WorkplaceRoute } from './workplaces'

// Import Role Route
import { RoleRoute } from './roles/role.route'

// Import File Route
import { FileRoute } from './files/file.route'

// Import Workload Route
import { WorkloadRoute } from './workload/workload.route'

// Import Lounge Route
import { LoungeRoute } from './lounge/lounge.route'

// Import Group Route
import { GroupRoute } from './groups/group.route'

// Import Circuit Breaker components
import { CircuitBreakerRoute, circuitBreakerManager } from './shared/circuit-breakers'

// Import permission initializer
import { initializePermissionsOnStartup } from './shared/permission-initializer'

// Define the express application
const app = express()

// Configure Express to trust proxy headers for real IP detection
// This is essential when deployed behind load balancers, reverse proxies, or CDNs
if (NODE_ENV === 'prod') {
    // In production, trust the first proxy (load balancer/CDN)
    app.set('trust proxy', 1)
} else {
    // In development, trust all proxies for testing
    app.set('trust proxy', true)
}

// Import Redis function
import { isRedisAvailable } from './redis'

// Import path
import path from 'path'

// Import request timer middleware
import { requestTimer } from './middleware/request-timer.middleware'

// Cors middleware for origin and Headers
app.use(cors())

// Allow any method from any host and log requests
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, PATCH')
    if ('OPTIONS' === req.method) {
        res.sendStatus(200)
    } else {
        next()
    }
})

// Adding json middleware which only handles JSON and urlencoded data
app.use(express.json())

// Add urlencoded to the application
app.use(express.urlencoded({ extended: true }))

// Use Morgan middleware for logging every request status on console
app.use(morgan('dev'))

// Default Route
app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: `${APP_NAME} server is working!` })
})

// Static files route
app.use('/api/health', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: `${APP_NAME} server is working!` })
})

// Health check Route
app.get('/health', async (req: Request, res: Response, next: NextFunction) => {
    try {

        // Check database connection status
        const db_status_promise = db.query('select 1')
            .then(() => 'available')
            .catch(() => 'unavailable')

        // Check Redis connection
        const redis_status_promise = isRedisAvailable() ? 'available' : 'unavailable'

        // Check circuit breaker manager status
        const circuit_breaker_status = circuitBreakerManager.isReady() ? 'available' : 'unavailable'

        // Get circuit breaker metrics
        const circuit_breaker_metrics = circuitBreakerManager.isReady() ? 
            circuitBreakerManager.getMetrics() : null

        // Wait for both statuses
        const [db_status, redis_status] = await Promise.all([db_status_promise, redis_status_promise])

        // Determine overall health
        const allServicesHealthy = db_status === 'available' && 
                                 redis_status === 'available' && 
                                 circuit_breaker_status === 'available' &&
                                 (!circuit_breaker_metrics || circuit_breaker_metrics.openBreakers === 0)

        // If all services are available, send a 200 response
        if (allServicesHealthy) {
            res.status(200).json({
                status: 'up',
                application: APP_NAME,
                environment: `${process.env.NODE_ENV}`,
                message: `${APP_NAME} is working!`,
                components: [
                    { database: db_status },
                    { redis: redis_status },
                    { circuit_breakers: circuit_breaker_status }
                ],
                circuit_breaker_metrics: circuit_breaker_metrics
            })

        } else {

            // If any of them is unavailable, return a 424 response
            res.status(503).json({
                status: 'down',
                application: APP_NAME,
                environment: `${process.env.NODE_ENV}`,
                message: `${APP_NAME} is unstable!`,
                components: [
                    { database: db_status },
                    { redis: redis_status },
                    { circuit_breakers: circuit_breaker_status }
                ],
                circuit_breaker_metrics: circuit_breaker_metrics
            })
        }

    } catch (error) {

        // Return 503 response
        res.status(503).json({
            status: 'failure',
            application: APP_NAME,
            environment: `${process.env.NODE_ENV}`,
            message: `${APP_NAME} is not working!`,
            error: error
        })
    }
})

// Logging middleware, after initial setup and before route definitions
// app.use(createWebRequestLogTransaction)

// Add request timer middleware
app.use(requestTimer)

// Initialize permissions and roles during startup
initializePermissionsOnStartup()
    .then(() => {
        appLogger('Permission Initialization', {
            level: 'info',
            message: 'Permissions initialized successfully during startup',
            environment: NODE_ENV,
        });
    })
    .catch((error) => {
        appLogger('Permission Initialization', {
            level: 'error',
            message: 'Permission initialization failed during startup',
            error: error.message,
            environment: NODE_ENV,
        });
    });

// Correct REST naming
app.use('/v1/auths', new AuthRoute().router)
app.use('/v1/notifications', new NotificationRoute().router)
app.use('/v1/users', new UserRoute().router)
app.use('/v1/workplaces', new WorkplaceRoute().router)
app.use('/v1/roles', new RoleRoute().router)
app.use('/v1/files', new FileRoute().router)
app.use('/v1/workload', new WorkloadRoute().router)
app.use('/v1/lounges', new LoungeRoute().router)
app.use('/v1/groups', new GroupRoute().router)
app.use('/v1/circuit-breakers', new CircuitBreakerRoute().router)

// Invalid routes handling middleware
app.all('*', (req: Request, res: Response, next: NextFunction) => {

    // Send Status 404 response
    res.status(404).json({
        message: 'Not found, check your URL please!'
    })
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    appLogger('Error', {
        level: 'error',
        error: err.message,
        stack: err.stack,
        environment: NODE_ENV,
    })
    
    // Return a more detailed error response
    return res.status(500).json({
        success: false,
        error: {
            code: 500,
            timestamp: new Date().toISOString(),
            message: err.message || 'Internal server error',
            details: err.stack || 'No stack trace available'
        }
    })
})

// Compressing the application
app.use(compression())

// Version endpoint
app.get('/version', (req: Request, res: Response) => {
    res.json({
        version: '1.0.0',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    })
})

// Export the application
export default app 