// Import Express Router
import { Router } from 'express'

// Import Resource Scheduler Controller
import { ResourceManagerController as Controller } from './resource-manager.controller'

// Import Resource Scheduler Service
import { ResourceManagerService as Service } from './resource-manager.service'

// Create Router
export const ResourceManagerRoute = Router()

// Create Controller Instance
export const ResourceManagerController = new Controller()

// Create Service Instance
export const ResourceManagerService = new Service()

// Define Routes
ResourceManagerRoute.post('/shutdown', ResourceManagerController.shutdown)
ResourceManagerRoute.post('/startup', ResourceManagerController.startup)
ResourceManagerRoute.get('/status', ResourceManagerController.getStatus)
ResourceManagerRoute.get('/schedule', ResourceManagerController.getSchedule)
ResourceManagerRoute.post('/schedule', ResourceManagerController.createSchedule)
ResourceManagerRoute.delete('/schedule/:id', ResourceManagerController.deleteSchedule)

// CloudWatch Management Routes
ResourceManagerRoute.get('/cloudwatch/analyze', ResourceManagerController.analyzeCloudWatchCosts)
ResourceManagerRoute.post('/cloudwatch/optimize', ResourceManagerController.optimizeCloudWatchLogs)
ResourceManagerRoute.get('/cloudwatch/alarms', ResourceManagerController.getCloudWatchAlarms)

// S3 Management Routes
ResourceManagerRoute.get('/s3/analyze', ResourceManagerController.analyzeS3Costs)
ResourceManagerRoute.post('/s3/optimize', ResourceManagerController.optimizeS3Buckets)
