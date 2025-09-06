// Express Module
import express, { NextFunction, Request, Response } from 'express'

// Cors Module
import cors from 'cors'

// Morgan Module
import morgan from 'morgan'

// Compression Module
import compression from 'compression'

// Import AWS Module
import { xray_express } from './shared/aws'

// Import logger and error handling
import { logger, handleError } from './shared'

// Import resource scheduler routes and controller
import { ResourceManagerRoute, ResourceManagerController } from './resource-manager'

// Fetch Environment Variables
const { APP_NAME, NODE_ENV } = process.env

// Define the express application
const app = express()

// track initialization status
let appInitialized = false

// initialize app dependencies
export async function initializeApp() {
  // skip if already initialized
  if (appInitialized) {
    return
  }

  try {
    // initialize any dependencies here
    logger.info('Initializing resource scheduler service', { component: 'app' })
    
    // mark as initialized
    appInitialized = true
    logger.info('Resource scheduler service initialized', { component: 'app' })
  } catch (error: any) {
    logger.error('App initialization failed', { component: 'app', error: error instanceof Error ? error : new Error(String(error)) })
    throw error
  }
}

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

// Skip Morgan in Lambda - CloudWatch handles logging
// Only use in local development
if (process.env.NODE_ENV === 'local') {
    app.use(morgan('dev'))
}

// Open the Segment
app.use(xray_express.openSegment(`${NODE_ENV}_${APP_NAME}`))

// Default Route
app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: `${APP_NAME} Server is working!` })
})

// Health check Route
app.get('/api/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({
            status: 'healthy',
            service: APP_NAME,
            environment: NODE_ENV,
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        logger.error('Health check failed', { component: 'health', error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({
            status: 'unhealthy',
            service: APP_NAME,
            environment: NODE_ENV,
            error: error.message
        })
    }
})

// Resource Scheduler Routes
app.use('/api/resource-manager', ResourceManagerRoute)

// Manual trigger routes
app.post('/api/shutdown', ResourceManagerController.manualShutdown)
app.post('/api/startup', ResourceManagerController.manualStartup)
app.get('/api/status', ResourceManagerController.getResourceStatus)

// Close the Segment
app.use(xray_express.closeSegment())

// Error handling middleware
app.use(handleError)

export default app
