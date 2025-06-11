// Import Cluster Module
import cluster from 'cluster'

// DotEnv Module
import dotenv from 'dotenv'

// Fetch Number of CPU Cores 
import { cpus } from 'os'

// Import logger
import logger, { updateLoggerLevel, appLogger } from './src/logger'

// Import AWS Service
import { awsService } from './src/aws'

// Import environment validation
import { validateEnv } from './src/config'

// Load the config from the .env file
if (process.env.NODE_ENV === 'local') {

    // Load the config from the .env file
    dotenv.config()

    // Validate environment variables
    validateEnv()

    // Update logger level
    updateLoggerLevel()

    // Log the environment
    logger.info('Environment \t: Local environment configured')
} else {
    // Validate environment variables (App Runner has already loaded them)
    validateEnv()

    // Update logger level
    updateLoggerLevel()

    // Log that we're using App Runner managed environment
    logger.info('Environment \t: App Runner managed environment', {
        environment: process.env.NODE_ENV,
        region: process.env.AWS_DEFAULT_REGION
    })
}

// Express App
import app from './src/app'

// Import database function
import { initiliazeDatabase } from './src/database'

// Import Redis function
import { connectRedis } from './src/redis'

// Import node-fetch module
import { Headers } from 'node-fetch'

// Assign fetch and Headers to the global scope
(global as any).Headers = Headers

// Prepare a global connection map
export let global_connection_map = new Map<String, Object>()

// Cluster variable
const isClusterRequired = process.env.CLUSTER

/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
async function setupWorkerProcesses() {
    logger.info('Master cluster is setting up ' + cpus().length + ' workers')
    logger.info('Master PID: ' + process.pid + ' is running')

    // Fork workers
    for (let i = 0; i < cpus().length; i++) {
        const worker = cluster.fork()
        logger.info('Message: ' + cpus()[i].model + ' is starting ...')
    }

    // Listen for messages from workers
    cluster.on('message', (worker, message) => {
        logger.info('Message: ' + JSON.stringify(message))
    })

    // Listen for online workers
    cluster.on('online', (worker) => {
        logger.info('Worker ID: ' + worker.id + ' and the PID: ' + worker.process.pid)
    })

    // Listen for worker death
    cluster.on('exit', (worker, code, signal) => {
        logger.info('Worker ID: ' + worker.id + ' with PID: ' + worker.process.pid + ' died with CODE: ' + code + ' and SIGNAL: ' + signal)
        logger.info('Forking another Worker')
        cluster.fork()
    })

    // Listen for errors
    cluster.on('error', (error) => {
        logger.error('Error: ' + error)
    })
}

/**
 * Setup an express server and define port to listen all incoming requests for this application
 */
async function setUpExpressApplication() {

    // HTTP Module
    const http = require('http')

    // Fetch Environment Variables
    const { PORT, HOST, NODE_ENV, APP_NAME } = process.env

    // Creating Microservice Server
    const server = http.createServer(app)

    console.log('DB HOST', process.env.DB_WRITER_HOST)
    console.log('DB HOST', process.env.DB_READER_HOST)
    console.log('DB PORT', process.env.DB_PORT)
    console.log('DB USER', process.env.DB_USER)
    console.log('DB NAME', process.env.DB_NAME)
    console.log('DB PASS', process.env.DB_PASS)
    console.log('REDIS HOST', process.env.REDIS_HOST)
    console.log('REDIS PORT', process.env.REDIS_PORT)

    // Connect Database
    const dbStatus = await initiliazeDatabase()
    if (!dbStatus.connected) {
        logger.warn('Database credentials unavailable, running in degraded mode')
    }

    // Connect Redis
    const redisStatus = await connectRedis()
    if (!redisStatus) {
        logger.warn('Redis is unavailable, running in degraded mode')
    }

    // Catch unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection at: ' + JSON.stringify(promise) + ' reason: ' + JSON.stringify(reason))
    })

    // Catch uncaught exceptions globally
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown:', error)
        process.exit(1)
    })

    // Exposing the server to the desired port
    server.listen(Number(PORT), HOST, () => {
        appLogger(APP_NAME + ' server is working')
        appLogger(HOST + ':' + PORT)
        appLogger(NODE_ENV + ' environment')
        appLogger(process.pid + ' is listening to all incoming requests')
    })
}

// If it is a master process then call setting up worker process
if (isClusterRequired == 'true' && cluster.isMaster) {

    // Setup worker processes
    setupWorkerProcesses()
    
} else {

    // To setup server configurations and share port address for incoming requests
    setUpExpressApplication()
}