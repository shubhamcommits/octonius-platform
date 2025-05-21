// Import File Stream Module
import { Readable } from 'stream'

// Import Cluster Module
import cluster from 'cluster'

// DotEnv Module
import dotenv from 'dotenv'

// Fetch Number of CPU Cores 
import { cpus } from 'os'

// Load the config from the .env file
dotenv.config()

// Express App
import app from './src/app'

// Import database function
import { initiliazeDatabase } from './src/database'

// Import Redis function
import { connectRedis, deleteRedisKeysByPrefix, disconnectRedis } from './src/redis'

// Import node-fetch module
import { Headers } from 'node-fetch'

// Import logger
import logger from './src/logger'

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
    logger.info(`Master cluster is setting up ${cpus().length} workers`)
    logger.info(`Master PID: ${process.pid} is running`)

    // Fork workers
    for (let i = 0; i < cpus().length; i++) {
        const worker = cluster.fork()
        logger.info(`Message: ${cpus()[i].model} is starting ...`)
    }

    // Listen for messages from workers
    cluster.on('message', (worker, message) => {
        logger.info(`Message: ${JSON.stringify(message)}`)
    })

    // Listen for online workers
    cluster.on('online', (worker) => {
        logger.info(`Worker ID: ${worker.id} and the PID: ${worker.process.pid}`)
    })

    // Listen for worker death
    cluster.on('exit', (worker, code, signal) => {
        logger.error(`Worker ID: ${worker.id} with PID: ${worker.process.pid} died with CODE: ${code} and SIGNAL: ${signal}`)
        logger.info('Forking another Worker')
        cluster.fork()
    })

    // Listen for errors
    cluster.on('error', (error) => {
        logger.error(`Error: ${error}`)
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

    // Connect Database
    await initiliazeDatabase()
        .catch((error) => { })

    // Connect Redis
    await connectRedis()
        .then((data: any) => {
            // Set redis client
            global_connection_map.set('redis', data.connection)

            // Remove cache if redis was connected successfully
            deleteRedisKeysByPrefix('')
        })
        .catch((error) => {
            // Disconnect Redis 
            disconnectRedis()

            logger.error(`Redis \t\t: Unable to connect to Redis - ${JSON.stringify(error)}`)
            process.exit(1)
        })

    // Catch unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason)
    })

    // Catch uncaught exceptions globally
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown:', error)
        process.exit(1)
    })

    // Exposing the server to the desired port
    server.listen(PORT, HOST, () => {
        logger.info(`Application \t: ${APP_NAME} server is working!`)
        logger.info(`Hostname \t: http://${HOST}:${PORT}`)
        logger.info(`Environment \t: ${NODE_ENV}`)
        logger.info(`Process \t: ${process.pid} is listening to all incoming requests`)
    })
}

// If it is a master process then call setting up worker process
if (isClusterRequired == 'true' && cluster.isMaster) {
    setupWorkerProcesses()
} else {
    // To setup server configurations and share port address for incoming requests
    setUpExpressApplication()
}