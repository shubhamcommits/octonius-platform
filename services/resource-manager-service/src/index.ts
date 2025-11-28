// serverless http adapter
import serverlessHttp from 'serverless-http'

// secrets loader
import { loadServiceSecrets } from './utils/secrets-manager'

// logger
import { logger } from './shared/logger'

// track if lambda is initialized
let bootstrapped = false

// cached handler instance
let serverlessHandler: any = null

// bootstrap function to initialize lambda
async function bootstrap() {
  // only run once per lambda container
  if (!bootstrapped) {
    // log start
    logger.info('Loading secrets', { component: 'bootstrap' })
    
    // load from secrets manager
    await loadServiceSecrets()
    
    // confirm loaded
    logger.info('Secrets loaded successfully', { component: 'bootstrap' })
    
    // import and initialize app after env vars are ready
    logger.info('Initializing app', { component: 'bootstrap' })
    const app = require('./app').default
    
    // wait for app initialization
    const { initializeApp } = require('./app')
    await initializeApp()
    
    // create serverless handler
    serverlessHandler = serverlessHttp(app, {
      request: (request: any, event: any, context: any) => {
        // attach lambda event
        request.event = event
        
        // attach lambda context
        request.context = context
      }
    })
    
    // mark as initialized
    bootstrapped = true
    
    logger.info('App ready', { component: 'bootstrap' })
  }
}

// main lambda handler
export const handler = async (event: any, context: any) => {
  // ensure initialized
  await bootstrap()
  
  // set context to not wait for empty event loop and this allows Lambda to freeze immediately after response
  context.callbackWaitsForEmptyEventLoop = false
  
  // handle request
  return serverlessHandler(event, context)
}
