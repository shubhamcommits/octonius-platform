// Import Cluster Module
import cluster from 'cluster'

// DotEnv Module
import dotenv from 'dotenv'

// Fetch Number of CPU Cores 
import { cpus } from 'os'

// Import logger
import { appLogger } from './src/logger'

// Import AWS Service
import { awsService } from './src/aws'

// Import environment validator
import { validateEnvironmentVariables } from './src/env-validator'

// Load the config from the .env file
if (process.env.NODE_ENV === 'local') {

    // Load the config from the .env file
    dotenv.config()

    // Log the environment
    appLogger('Environment \t: Local environment configured')

    // Validate environment variables
    validateEnvironmentVariables()

} else {

    // Log that we're using App Runner managed environment
    appLogger('Environment \t: App Runner managed environment', {
        environment: process.env.NODE_ENV,
        region: process.env.AWS_DEFAULT_REGION
    })

    // Validate environment variables (App Runner has already loaded them)
    validateEnvironmentVariables()
}

// Express App
import app from './src/app'

// Import database function
import { initiliazeDatabase } from './src/database'

// Import Redis function
import { connectRedis, deleteRedisKeysByPrefix, disconnectRedis } from './src/redis'

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
    appLogger('Master cluster is setting up ' + cpus().length + ' workers')
    appLogger('Master PID: ' + process.pid + ' is running')

    // Fork workers
    for (let i = 0; i < cpus().length; i++) {
        const worker = cluster.fork()
        appLogger('Message: ' + cpus()[i].model + ' is starting ...')
    }

    // Listen for messages from workers
    cluster.on('message', (worker, message) => {
        appLogger('Message: ' + JSON.stringify(message))
    })

    // Listen for online workers
    cluster.on('online', (worker) => {
        appLogger('Worker ID: ' + worker.id + ' and the PID: ' + worker.process.pid)
    })

    // Listen for worker death
    cluster.on('exit', (worker, code, signal) => {
        appLogger('Worker ID: ' + worker.id + ' with PID: ' + worker.process.pid + ' died with CODE: ' + code + ' and SIGNAL: ' + signal)
        appLogger('Forking another Worker')
        cluster.fork()
    })

    // Listen for errors
    cluster.on('error', (error) => {
        appLogger('Error: ' + error)
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
    // const dbStatus = await initiliazeDatabase()
    // if (!dbStatus.connected) {
    //     appLogger('DB creds unavailable, running in degraded mode', { level: 'warn' })
    // }

    // Connect Redis
    // const redisStatus = await connectRedis()
    // if (!redisStatus.connection) {
    //     appLogger('Redis unavailable, running in degraded mode', { level: 'warn' })
    // }

    // Catch unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        appLogger('Unhandled Promise Rejection at: ' + JSON.stringify(promise) + ' reason: ' + JSON.stringify(reason))
    })

    // Catch uncaught exceptions globally
    process.on('uncaughtException', (error) => {
        appLogger('Uncaught Exception thrown:', error)
        process.exit(1)
    })

    // Exposing the server to the desired port
    server.listen(Number(PORT), HOST, () => {
        appLogger('Application   : ' + APP_NAME + ' server is working!')
        appLogger('Hostname      : ' + HOST + ':' + PORT)
        appLogger('Environment   : ' + NODE_ENV)
        appLogger('Process       : ' + process.pid + ' is listening to all incoming requests')
    })
}

// If it is a master process then call setting up worker process
if (isClusterRequired == 'true' && cluster.isMaster) {
    setupWorkerProcesses()
} else {
    // To setup server configurations and share port address for incoming requests
    setUpExpressApplication()
}