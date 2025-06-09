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

// Define the express application
const app = express()

// Import Global Connection Map
import { global_connection_map } from '../server'

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

// Health check Route
app.get('/api/health', async (req: Request, res: Response, next: NextFunction) => {
    try {

        // Check database connection status
        const db_status_promise = db.query('select 1')
            .then(() => 'available')
            .catch(() => 'unavailable')

        // Fetch Redis Client
        let redis_client: any = global_connection_map.get('redis')

        // Check Redis connection
        const redis_status_promise = redis_client.ping()
            .then(() => 'available')
            .catch(() => 'unavailable')

        // Wait for both statuses
        const [db_status, redis_status] = await Promise.all([db_status_promise, redis_status_promise])

        // If all services are available, send a 200 response
        if (db_status === 'available' && redis_status === 'available') {
            res.status(200).json({
                status: 'up',
                application: APP_NAME,
                environment: `${process.env.NODE_ENV}`,
                message: `${APP_NAME} is working!`,
                components: [
                    { database: db_status },
                    { redis: redis_status }
                ]
            })

        } else {

            // If any of them is unavailable, return a 424 response
            res.status(200).json({
                status: 'down',
                application: APP_NAME,
                environment: `${process.env.NODE_ENV}`,
                message: `${APP_NAME} is unstable!`,
                components: [
                    { database: db_status },
                    { redis: redis_status }
                ]
            })
        }

    } catch (error) {

        // Return 503 response
        res.status(200).json({
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

// Correct REST naming
app.use('/v1/users', new UserRoute().router)

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
    res.status(500).json({ error: 'Internal Server Error' })
})

// Compressing the application
app.use(compression())

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    })
})

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